# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _, scrub
from frappe.utils import flt, nowdate
from frappe.model.document import Document

class PartyPortfolio(Document):
	def onload(self):
		"""Load the Opening Invoice summary"""
		summary, max_count = self.get_opening_invoice_summary()
		self.set_onload('opening_invoices_summary', summary)
		self.set_onload('max_count', max_count)
		self.set_onload('temporary_opening_account', get_temporary_opening_account(self.company))

	def validate(self):
		self.validate_bill_info()

		for d in self.get("detail", []):
			d.validate()

			# all missing party are to be created or linked
			self.create_customer_if_not_exists(d)

	def get_opening_invoice_summary(self):
		def prepare_invoice_summary(doctype, invoices):
			# add company wise sales / purchase invoice summary
			paid_amount = []
			outstanding_amount = []
			for invoice in invoices:
				company = invoice.pop("company")
				_summary = invoices_summary.get(company, {})
				_summary.update({
					"currency": company_wise_currency.get(company),
					doctype: invoice
				})
				invoices_summary.update({company: _summary})

				paid_amount.append(invoice.paid_amount)
				outstanding_amount.append(invoice.outstanding_amount)

			if paid_amount or outstanding_amount:
				max_count.update({
					doctype: {
						"max_paid": max(paid_amount) if paid_amount else 0.0,
						"max_due": max(outstanding_amount) if outstanding_amount else 0.0
					}
				})

		invoices_summary = {}
		max_count = {}
		fields = [
			"company", "count(name) as total_invoices", "sum(outstanding_amount) as outstanding_amount"
		]
		companies = frappe.get_all("Company", fields=["name as company", "default_currency as currency"])
		if not companies:
			return None, None

		company_wise_currency = {row.company: row.currency for row in companies}
		for doctype in ["Sales Invoice", "Purchase Invoice"]:
			invoices = frappe.get_all(doctype, filters=dict(is_opening="Yes", docstatus=1),
				fields=fields, group_by="company")
			prepare_invoice_summary(doctype, invoices)

		return invoices_summary, max_count

	def make_invoices(self):
		from frappe import db
		names = []
		mandatory_error_msg = _("Row {idx}: {field} is required to create the Opening Sales Invoices")

		if not self.company:
			frappe.throw(_("Please select the Company"))

		if not self.get("detail", []):
			frappe.throw(_("Please, specify at least one record before"))

		valid_rows = filter(lambda d: not d.invoice, self.get("detail", []))

		if not valid_rows:
			frappe.throw(_("All the records have a Sales Invoice already"))

		for row in valid_rows:
			if not row.qty:
				row.qty = 1.0

			# always mandatory fields for the invoices
			if not row.temporary_opening_account:
				row.temporary_opening_account = get_temporary_opening_account(self.company)

			if not row.item_name:
				row.item_name = _("Opening Invoice Item")
			if not row.posting_date:
				row.posting_date = nowdate()
			if not row.due_date:
				row.due_date = nowdate()

			# all missing party are to be created or linked
			self.create_customer_if_not_exists(row)

			for d in ("Customer", "Outstanding Amount", "Temporary Opening Account"):
				if not row.get(scrub(d)):
					frappe.throw(mandatory_error_msg.format(
						idx=row.idx,
						field=_(d)
					))


			args = self.get_invoice_dict(row=row)

			if not args:
				continue

			if row.invoice and \
				db.exists("Sales Invoice", row.invoice):

				frappe.throw(_("There is already an invoice against row {}") \
					.format(row.idx))

			doc = frappe.get_doc(args)
			doc.calculate_taxes_and_totals()
			doc.submit()

			# link the invoice for future ref
			# row.invoice = doc.name
			frappe.db.set(row, "invoice", doc.name)

			names.append(doc.name)

			frappe.publish_realtime(
				"progress", dict(
					progress=[row.idx, len(self.detail)],
					title=_('Creating {0}').format(doc.doctype)
				),
				user=frappe.session.user
			)

			if self.autocommit:
				db.sql("commit")

		return names

	def validate_bill_info(self):
		from frappe.utils import cstr

		if cstr(self.bill_no) \
			and not cstr(self.bill_date):
			frappe.throw(_("Bill Date is required if Bill No is provided"))

	def create_customer_if_not_exists(self, row):
		from frappe.utils import cint

		mandatory_error_msg = \
			_("Either Customer or Party is required in row {idx}")

		if not row.party \
			and not row.customer:
			frappe.throw(mandatory_error_msg \
				.format(idx=row.idx))

		if row.party == row.customer:
			# as probably there is nothing to do
			# frappe.errprint("party == customer")
			return False

		if row.customer and not row.party:
			row.party = row.customer

			# frappe.errprint("not party and customer")
			return False

		# if you made it to this point
		# that means that customer is not set but
		# the party yes
		#
		# # party = True
		# # customer = False

		from frappe import db

		party_doctype = "Customer"

		if cint(row.customer_exists):

			if not db.exists(party_doctype, row.party):
				frappe.throw(_("Party {} does not exist in row {}") \
					.format(row.party, row.idx))

			row.customer = row.party
			# frappe.errprint("customer_exists row {}".format(row.idx))

		else:

			doc = frappe.new_doc(party_doctype)

			doc.customer_name = row.party
			doc.customer_type = "Individual"

			# frappe.errprint("not customer_exists row {}".format(row.idx))
			if db.exists(party_doctype, row.party):
				# frappe.errprint("not customer_exists and db.exists row {}".format(row.idx))
				if not self.merge_new_parties:
					# frappe.errprint("not customer_exists and db.exists and not merge_new_parties row {}".format(row.idx))
					doc.insert()
					row.customer = doc.name

					# to avoid duplicates
					row.party = row.customer
				else:
					# frappe.errprint("not customer_exists and db.exists and merge_new_parties row {}".format(row.idx))
					row.customer = row.party
			else:
				# frappe.errprint("not customer_exists and not db.exists row {}".format(row.idx))
				doc.insert()

				row.customer = row.party


	def get_invoice_dict(self, row=None):
		def get_item_dict():
			default_uom = frappe.db.get_single_value("Stock Settings", "stock_uom") or _("Nos")
			cost_center = frappe.db.get_value("Company", self.company, "cost_center")
			if not cost_center:
				frappe.throw(
					_("Please set the Default Cost Center in {0} company").format(frappe.bold(self.company))
				)
			rate = flt(row.grand_total) - flt(row.tax_amount)
			rate /= flt(row.qty)

			return frappe._dict({
				"uom": default_uom,
				"rate": rate or 0.0,
				"qty": row.qty,
				"conversion_factor": 1.0,
				"item_name": row.item_name or _("Opening Invoice Item"),
				"description": row.item_name or _("Opening Invoice Item"),
				income_expense_account_field: row.temporary_opening_account,
				"cost_center": cost_center
			})

		from erpnext.controllers.accounts_controller import get_taxes_and_charges

		master_doctype = "Sales Taxes and Charges Template"

		master_name = frappe.db.get_value(master_doctype, {
			"disabled": False,
			"is_default": True,
		}, "name")

		if not master_name:
			frappe.throw(_("Please specify the default {}" \
				.format(master_doctype)))


		if not row:
			return None

		party_type = "Customer"
		income_expense_account_field = "income_account"

		item = get_item_dict()

		taxes = get_taxes_and_charges(master_doctype,
			master_name)

		if taxes:
			# taxes[0].included_in_print_rate = True
			taxes[0].charge_type = "Actual"
			taxes[0].tax_amount = row.tax_amount


		args = frappe._dict({
			"is_pos": False,
			"items": [item],
			"taxes_and_charges": master_name,
			"taxes": taxes,
			"is_opening": "No",
			"set_posting_time": 1,
			"company": self.company,
			"due_date": row.due_date,
			"posting_date": row.posting_date,
			frappe.scrub(party_type): row.party,
			"doctype": "Sales Invoice",
			"currency": frappe.db.get_value("Company", self.company, "default_currency")
		})

		return args

	def on_trashes(self):
		from frappe import db

		for d in self.get("detail", []):
			if not d.get("invoice") \
				or not db.exists("Sales Invoice", d.invoice):
				continue

			from frappe import _
			frappe.throw(_("Cannot delete Case File in row {idx} as it is linked with a Sales Invoice") \
				.format(idx=d.idx))

		values = {
			"parent": self.name,
			"parenttype": self.doctype,
			"parentfield": "detail",
		}

		db.sql("""
			Delete From
				`tabCase File`
			Where
				parent = %(parent)s
				and parenttype = %(parenttype)s
				and parentfield = %(parentfield)s
		""", values)

@frappe.whitelist()
def get_temporary_opening_account(company=None):
	if not company:
		return

	accounts = frappe.get_all("Account", filters={
		'company': company,
		'account_type': 'Temporary'
	})
	if not accounts:
		frappe.throw(_("Please add a Temporary Opening account in Chart of Accounts"))

	return accounts[0].name
