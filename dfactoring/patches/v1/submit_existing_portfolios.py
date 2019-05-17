# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

from frappe import get_list, get_doc, get_value

def execute():
    doctype = "Party Portfolio"

    for name, in get_list(doctype, as_list=True):
        doc = get_doc(doctype, name)

        if has_any_without_invoice(doc.get("detail", [])):
            continue

        doc.docstatus = 1L
        for d in doc.get("detail", []):
            d.docstatus = doc.docstatus
            d.db_update()

        doc.db_update()

def has_any_without_invoice(doclist):
    for d in doclist:
        if not d.get("invoice"):
            return True

    return False
