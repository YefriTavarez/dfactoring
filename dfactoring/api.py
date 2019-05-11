# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe


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
