# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

from frappe import db, scrub, _
from frappe.utils import flt, nowdate

@frappe.whitelist()
def generate_new_bill_no(serie, company, doctype, name):
	"""
		:params serie:  ex. B02.######### - ABS
		:params company:  ex. ABC, SRL
		:params doctype:  ex. Sales Invoice
		:params name:  ex. SINV-00064
	"""

	from frappe import get_doc, bold, _
	from frappe.utils import nowdate, get_fullname

	invoice_doc = get_doc(doctype, name)

	doctype = "Tax Receipt Management"

	tax_doc = get_doc(doctype, serie)

	invoice_doc.bill_no = tax_doc.get_next_value()
	invoice_doc.bill_date = nowdate()

	invoice_doc.add_comment("Edit", _("Tax Receipt was assigned by {}") \
		.format(bold(get_fullname())))

	invoice_doc.db_update()

	return invoice_doc

@frappe.whitelist()
def delete_invoice(cdt, cdn):
	from frappe import get_doc

	# fetch from the DataBase
	childdoc = get_doc(cdt, cdn)

	# get dynamically the doctype
	meta = childdoc.meta

	invoice_field = meta.get_field("invoice")

	if not invoice_field:
		return False

	doctype = invoice_field.options

	if not doctype:
		return False

	d = get_doc(doctype, childdoc.invoice)

	# clear the refs
	frappe.db.set(childdoc, "invoice", None)

	# reload from the db
	childdoc.reload()

	if d.docstatus == 1:
		d.cancel()

	d.delete()

	return childdoc

@frappe.whitelist()
def randomly_assign(docs):
	from frappe.desk.form.assign_to import add

	# USAGE
	#
	# args = {
    #     "assign_to": ,
    #     "doctype": ,
    #     "name": ,
    #     "description":
	# }

	if isinstance(docs, basestring):
		import json
		docs = json.loads(docs)

	from frappe import get_all, bold, _

	collector_users = [d.user for d in \
		get_all("Case Record Settings User",
			fields=["user"])]

	import random

	random.shuffle(collector_users)

	length = len(collector_users)

	idx = 0

	from frappe.utils import cint, get_fullname

	for doctype, name in docs:
		random.shuffle(collector_users)

		collector_user = collector_users[cint((idx + length) ** length % length)]

		add({
		    "assign_to": collector_user,
		    "doctype": doctype,
		    "name": name,
		    "description": _("Randomly assigned by {}" \
				.format(bold(get_fullname())))
		})

		idx += 1

@frappe.whitelist()
def get_mapped_purchase_invoice(source_name, target_doc=None):
	from frappe import _
	from frappe.model.mapper import get_mapped_doc

	source_doctype, target_doctype = \
		"Party Portfolio", "Purchase Invoice"

	if not target_doc:
		target_doc = frappe.new_doc(target_doctype)

	def postprocess(source, target):
		from \
			.dfactoring \
			.doctype \
			.party_portfolio \
			.party_portfolio \
		import \
			get_temporary_opening_account \
		as get_temp_acc

		default_uom = db.get_single_value("Stock Settings", "stock_uom") or _("Nos")
		cost_center = db.get_value("Company", source.company, "cost_center")

		target.append("items", {
			"doctype": "Purchase Invoice Item",
			"parenttype": "Purchase Invoice",
			"parentfield": "items",
			"rate": source.total_amount,
			"amount": source.total_amount,
			"qty": 1,
			"conversion_factor": 1,
			"uom": default_uom,
			"cost_center": cost_center,
			"item_name": _("Opening Invoice Item"),
			"description": _("Opening Invoice Item"),
			"expense_account": get_temp_acc(source.company),
		})

		# target.run_method("calculate_taxes_and_totals")

	doc = get_mapped_doc(source_doctype, source_name, {
		source_doctype: {
			"doctype": target_doctype,
			"field_map": {
				"name": "party_portfolio",
			},
			"condition": lambda d: doc.docstatus == 1
		},
		"Purchase Taxes and Charges": {
			"doctype": "Purchase Taxes and Charges",
			"add_if_empty": True
		}
	}, target_doc, postprocess)

	return doc

@frappe.whitelist()
def get_customer_phones(customer):
	from frappe import db

	return db.sql_list("""
		Select
			phone_number
		From
			`tabCustomer Phones`
		Where
			parent = %s
			And parentfield = "customer_phones"
			And parenttype = "Customer"
	""", customer)

@frappe.whitelist()
def get_case_records(case_file):
	from frappe import db

	return db.sql("""
		Select
			`tabCase Record`.activity_type,
			`tabCase Record`.activity_option,
			`tabCase Record`.notes,
			`tabCase Record`.contact_mean
		From
			`tabCase Record`
		Where
			`tabCase Record`.reference_type = "Case File"
			And `tabCase Record`.reference_name = %s
	""", case_file, as_dict=True)

@frappe.whitelist()
def get_party_account_currency(party_type, party, company):
	from erpnext.accounts.party import get_party_account_currency
	return get_party_account_currency(party_type, party, company)
