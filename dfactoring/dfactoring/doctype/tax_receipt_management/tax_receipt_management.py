# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class TaxReceiptManagement(Document):
	def autoname(self):
		self.set_new_name()

	def validate(self):
		# self.split_serie()

		self.validate_values()
		self.validate_due_date()
		self.validate_current_values()

	def validate_values(self):
		# validate values

		for fieldname in (
			"current_value",
			"max_value",
		): self.validate_value(fieldname, ">=", .000)

	def after_insert(self):
		self.split_serie()
		self.append_to_tab_series()

	def split_serie(self):
		if self.get("serie_splited"):
			return False

		serie = self.serie

		parts = serie.split(".")

		self.set("serie_splited", parts[0] if parts else self.serie)

	def set_new_name(self):
		self.split_serie()
		self.name = "{} - {}" \
			.format(self.get("serie_splited"), self.abbr)

	def append_to_tab_series(self):
		from frappe import db

		# if the series exists, then forget
		# about inserting it

		if db.sql("""
			Select
				name
			From
				tabSeries
			Where
				name = "{serie}"
		""".format(serie=self.get("serie_splited"))):
			return False

		db.sql("""
			Insert Into
				tabSeries (name, current)
			Values
				(%(serie)s, {current_value})
		""".format(current_value=self.current_value), {
			"serie": self.get("serie_splited"),
		})

	def validate_due_date(self):
		from frappe.utils import nowdate, cstr

		if cstr(self.due_date) >= nowdate():
			return

		from frappe import _
		frappe.throw(_("Due Date cannot be past"))

	def validate_current_values(self):
		if not self.max_value:
			return False

		if not self.current_value > self.max_value:
			return False

		from frappe import bold, _
		frappe.throw(_("Current Value has reached Max Value for Serie {}") \
			.format(bold(self.name)))

	def get_next_value(self):
		"""Will return the next safe value for this serie"""

		self.split_serie()

		# make some common validations
		
		self.validate_values()
		self.validate_due_date()

		from frappe import db

		db.sql("""
			Update
				tabSeries
			Set
				current = {current_value}
			Where
				name = %(serie)s
		""".format(current_value=self.current_value), {
			"serie": self.get("serie_splited"),
		})

		frappe.db.set(self, "current_value", self.current_value + 1)

		# reload from the database with all the changes
		
		self.reload()

		# let's make sure that user has not reached the limit

		self.validate_current_values()

		# to prevent the system from fetching a
		# non-updated value

		db.sql("commit")

		from frappe.model.naming import make_autoname

		# if we don't commit before getting here
		# it will fetch the value from another transaction

		return make_autoname(self.serie)
