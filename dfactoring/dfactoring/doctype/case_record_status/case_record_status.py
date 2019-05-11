# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe import _

class CaseRecordStatus(Document):
	def validate(self):
		if self.default:
			self.clear_defaults()

		self.validate_enabled_and_default()

	def clear_defaults(self):
		frappe.db.sql("""Update
			`tabCase Record Status`
			Set `default` = 0
			Where `name` != %s""",
		self.name)

	def validate_enabled_and_default(self):
		if not self.default or self.enabled:
			return

		message = _("Cannot set disable and default at the same time")
		frappe.throw(message)

