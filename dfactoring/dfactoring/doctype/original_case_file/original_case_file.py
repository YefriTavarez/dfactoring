# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

from frappe import db, _
from frappe.utils import cint, flt, cstr, nowdate

class OriginalCaseFile(Document):
	def validate(self):
		self.validate_bill_info()

		# all missing party are to be created or linked
		self.create_customer_if_not_exists()

		invoice_name = self.make_invoice()
		# self.calculate_taxes_and_totals()

		self.create_or_update_case_file(invoice_name)

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

	def after_insert(self):
		self.make_invoice()

	def make_invoice(self):
		if self.is_new():
			return False

		invoice_doctype = "Sales Invoice"

		if not self.get("company"):
			from frappe import defaults
			self.company = defaults \
				.get_user_default("company")

		invoice_filters = {
			"case_file": self.name,
			"docstatus": ["=", "1"]
		}

		doc = frappe.new_doc(invoice_doctype)

		if db.exists(invoice_doctype, invoice_filters):
			olddoc = frappe.get_doc(invoice_doctype, 
				invoice_filters)
			
			olddoc.flags.ignore_mandatory = True
			olddoc.flags.ignore_permissions = True

			olddoc.cancel()
			doc = frappe.copy_doc(olddoc)
			
			doc.docstatus = 0
			doc.status = "Draft"
			
			doc.set_docstatus()
			
			doc.amended_from = olddoc.name

			doc.__islocal = True

		# always mandatory fields for the invoices
		if not self.get("temporary_opening_account"):
			self.temporary_opening_account = \
				get_temporary_opening_account(self.get("company"))

		if not self.get("item_name"):
			self.item_name = _("Opening Invoice Item")
		if not self.get("posting_date"):
			self.posting_date = nowdate()
		if not self.get("due_date"):
			self.due_date = nowdate()

		# all missing party are to be created or linked
		self.create_customer_if_not_exists()

		args = self.get_invoice_dict()

		doc.update(args)

		doc.case_file = self.name
		doc.calculate_taxes_and_totals()

		doc.flags.ignore_mandatory = True
		doc.flags.ignore_permissions = True
		
		doc.submit()

		return doc.name

	def validate_bill_info(self):
		"""Not Implemented"""

		from frappe.utils import cstr

		if cstr(self.get("bill_no")) \
			and not cstr(self.get("bill_date")):
			frappe.throw(_("Bill Date is required if Bill No is provided"))

	def create_or_update_case_file(self, invoice_name):
		if self.is_new():
			return False
		
		case_file_filters = {
			"original_case_file": self.name,
			"docstatus": ["=", "1"],
		}

		target_doctype = "Case File"

		doc = frappe.new_doc(target_doctype)

		if db.exists(target_doctype, 
			case_file_filters):
			olddoc = frappe.get_doc(target_doctype, 
				case_file_filters)
			
			olddoc.flags.ignore_mandatory = True
			olddoc.flags.ignore_permissions = True

			olddoc.cancel()
			doc = frappe.copy_doc(olddoc)
			
			doc.docstatus = 0
			
			doc.set_docstatus()
			
			doc.amended_from = olddoc.name

			doc.__islocal = True

		from frappe.model.mapper import get_mapped_doc
		def postprocess(source, target):
			# target.user = None
			target.invoice = invoice_name
			target.qty = 1.000
			target.item_name = _("Opening Invoice Item")
			target.customer_exists = True
			target.party = self.get("customer")
			target.customer = self.get("customer")
			target.temporary_opening_account = self.get("temporary_opening_account")
			target.due_date = self.get("due_date")
			target.posting_date = self.get("posting_date")
			target.inclusive_amount = True
			target.grand_total = self.due_capital_balance

		get_mapped_doc(self.doctype, self.name, {
			self.doctype: {
				"doctype": target_doctype,
				"field_map": {
					"due_capital_balance": "outstanding_amount",
					"interest_rate": "comission_rate",
					"interest_balance": "comission_amount",
					"other_charges_balance": "additional_fee",
					"name": "original_case_file",
				}
			}
		}, doc, postprocess)

		doc.flags.ignore_mandatory = True
		doc.flags.ignore_permissions = True

		doc.submit()
		

	def create_customer_if_not_exists(self):
		party_doctype = "Customer"

		filters = {
			"tax_id": self.tax_id,
		}

		doc = frappe.new_doc(party_doctype)

		if db.exists(party_doctype, filters): 
			doc = frappe.get_doc(party_doctype, filters)

		doc.update({
			"customer_name": self.full_name,
			"customer_type": "Individual",
			"tax_id": self.tax_id,
			"customer_phones": [],
			"customer_reference": [],
		})

		self.add_customer_numbers(doc)
		self.add_customer_references(doc, "guarantor_1")
		self.add_customer_references(doc, "guarantor_2")
		self.add_customer_references(doc, "guarantor_3")

		self.add_customer_references(doc, "co_debtor", True)

		# let's make sure that the customer saves
		doc.flags.ignore_mandatory = True
		doc.flags.ignore_permissions = True

		self.customer = doc.name

		doc.save()

	def add_customer_references(self, doc, prefix, is_co_debtor=False):
		if not self.get("{prefix}_full_name" \
			.format(prefix=prefix)) \
			or not self.get("{prefix}_tax_id" \
				.format(prefix=prefix)) \
			or not self.get("{prefix}_mobile_1" \
				.format(prefix=prefix)):
			return False

		doc.append("customer_reference", {
			"full_name": self.get("{prefix}_full_name" \
				.format(prefix=prefix)),
			"tax_id": self.get("{prefix}_tax_id" \
				.format(prefix=prefix)),
			"mobile_1": self.get("{prefix}_mobile_1" \
				.format(prefix=prefix)),
			"mobile_2": self.get("{prefix}_mobile_2" \
				.format(prefix=prefix)),
			"mobile_3": self.get("{prefix}_mobile_3" \
				.format(prefix=prefix)),
			"email": self.get("{prefix}_email" \
				.format(prefix=prefix)),
			"address": self.get("{prefix}_address" \
				.format(prefix=prefix)),
			"kin": self.get("{prefix}_kin" \
				.format(prefix=prefix)),
			"is_co_debtor": is_co_debtor,
		})

	def add_customer_numbers(self, doc):
		from frappe import unscrub
	
		phone_map = {
			"mobile_1": self.get("mobile_1"),
			"mobile_2": self.get("mobile_2"),
			"mobile_3": self.get("mobile_3"),
			"aditional_number": self.get("aditional_number"),
			"other_number": self.get("other_number"),
			"landing_number": self.get("landing_number"),
		}

		for key in phone_map.keys():
			if not phone_map[key]:
				continue

			doc.append("customer_phones", {
				"phone_number": phone_map[key],
				"description": unscrub(key)
			})

	def get_invoice_dict(self):
		def get_item_dict():
			default_uom = db.get_single_value("Stock Settings", "stock_uom") or _("Nos")
			cost_center = db.get_value("Company", self.get("company"), "cost_center")

			if not cost_center:
				frappe.throw(
					_("Please set the Default Cost Center in {0} company") \
						.format(frappe.bold(self.get("company")))
				)

			item_name = _("Opening Invoice Item")

			return frappe._dict({
				"uom": default_uom,
				"rate": flt(self.due_capital_balance),
				"qty": 1.000,
				"conversion_factor": 1.000,
				"item_name": item_name,
				"description": item_name,
				income_expense_account_field: self.get("temporary_opening_account"),
				"cost_center": cost_center,
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

		income_expense_account_field = "income_account"

		item = get_item_dict()

		taxes = get_taxes_and_charges(master_doctype,
			master_name)

		if taxes:
			# taxes[0].included_in_print_rate = True
			taxes[0].charge_type = "Actual"
			taxes[0].tax_amount = self.get("tax_amount")

		args = frappe._dict({
			"is_pos": False,
			"items": [item],
			"taxes_and_charges": master_name,
			"taxes": taxes,
			"is_opening": "No",
			"set_posting_time": 1.000,
			"company": self.get("company"),
			"due_date": self.get("due_date"),
			"posting_date": self.get("posting_date"),
			"customer": self.get("customer"),
			"doctype": "Sales Invoice",
			"currency": frappe.db.get_value("Company", self.get("company"), "default_currency")
		})

		return args

	def calculate_taxes_and_totals(self):
		pass

@frappe.whitelist()
def get_temporary_opening_account(company=None):
	if not company:
		return

	accounts = frappe.get_all("Account", filters={
		'company': company,
		'account_type': 'Temporary',
		'account_currency': db.get_value("Company", company, "default_currency")
	})

	if not accounts:
		accounts = frappe.get_all("Account", filters={
			'company': company,
			'account_type': 'Temporary',
		})

	if not accounts:
		accounts = frappe.get_all("Account", filters={
			'company': company,
			'account_type': 'Income Account',
			'account_currency': db.get_value("Company", company, "default_currency"),
		})

	if not accounts:
		frappe.throw(_("Please add a Temporary Opening account in Chart of Accounts"))

	return accounts[0].name
