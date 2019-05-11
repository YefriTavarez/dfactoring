# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class CaseFile(Document):
	def validate(self):

		for fieldname in (
			"comission_rate",
			"tax_rate",
			"grand_total",
			"outstanding_amount",
			"additional_fee",
			"discount_amount",
		): self.validate_value(fieldname, ">=", .000)

		self.validate_discount()

		self.set_missing_values()

	def validate_discount(self):
		from frappe import _

		if not self.discount_amount > self.outstanding_amount:
			return False

		invalid_discount_message = "The Discount Amount cannot be" \
			" greater than the Outstanding Amount"

		frappe.throw(_(invalid_discount_message))

	def set_missing_values(self):
		self.set_comission_amount()
		self.set_tax_amount()
		self.set_grand_total()

	def set_comission_amount(self):
		from frappe.utils import flt

		comission_rate = flt(self.comission_rate) \
			/ 100.000

		# comission_rate += 1

		self.comission_amount = comission_rate \
			* flt(self.outstanding_amount)

	def set_tax_amount(self):
		from frappe.utils import flt

		tax_rate = flt(self.tax_rate) \
			/ 100.000

		# tax_rate += 1

		if self.inclusive_amount:
			tax_rate += 1

			self.tax_amount = self.comission_amount \
				- (
					self.comission_amount \
						/ tax_rate
				)

		else:
			self.tax_amount = tax_rate \
				* flt(self.comission_amount)

	def set_grand_total(self):
		from frappe.utils import flt

		self.grand_total = self.outstanding_amount \
			+ self.comission_amount \
			+ self.tax_amount \
			+ self.additional_fee \
			- self.discount_amount

	def create_new_case_record(self):
		doc = frappe.new_doc("Case Record")

		doc.update({
			"reference_type": self.doctype,
			"reference_name": self.name,
			"customer": self.customer,
		})

		return doc
