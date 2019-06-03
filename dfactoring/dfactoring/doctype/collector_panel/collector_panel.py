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
			"paid_to": self.get_mode_of_payment_account(
				mode_of_payment
			)
		})

		doc.flags.ignore_permissions = True
		doc.submit()

	def get_mode_of_payment_account(self, mode_of_payment):
		from frappe import db

		result = db.sql("""
			Select
				default_account
			From
				`tabMode of Payment Account`
			Where
				parentfield = "accounts"
				And parenttype = "Mode of Payment"
				And parent = %s
		""", mode_of_payment)

		return result[0][0] if result else None

	def fetch_daily_reminders(self):
		from frappe import db, session
		from frappe.utils import today

		values = {
			"user": session.user,
			"today": today(),
		}

		return db.sql(
			"""
				Select
					`tabCase Record`.`name`,
					`tabCase Record`.`customer`,
					`tabCase Record`.`next_contact_date`,
					`tabCase Record`.`next_contact_mean`,
					`tabCase Record`.`status`,
					`tabCase Record`.`notes`,
					`tabCase Record`.`activity_type`,
					`tabCase Record`.`reference_type`,
					`tabCase Record`.`reference_name`,
					`tabCase Record`.`activity_option`
				From
					`tabCase Record`
				Where
					`tabCase Record`.`next_contact_date` Is Not Null
					And `tabCase Record`.`owner` = %(user)s
					And (
						`tabCase Record`.`next_contact_date` = %(today)s
							Or (
								`tabCase Record`.`status` = "Remind Always"
								And `tabCase Record`.`next_contact_date` < %(today)s
							)
					)
			""", values,
		as_dict=True, debug=False)
