# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

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
