# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

from frappe import db, _

class CollectorPanel(Document):
	def make_payment_entry(self, paid_amount, mode_of_payment, 
		reference_no=None, reference_date=None):
		error_msg = \
			"Cannot create a Payment Entry for this Case File as it is not validated yet"

		if not self.get("invoice"):
			frappe.throw(_(error_msg))

		from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

		doc = get_payment_entry(self.meta.get_field("invoice").options,
			self.invoice, paid_amount)

		doc.update({
			"mode_of_payment": mode_of_payment,
			"reference_no": reference_no,
			"reference_date": reference_date,
		})

		doc.flags.ignore_permissions = True
		doc.submit()
