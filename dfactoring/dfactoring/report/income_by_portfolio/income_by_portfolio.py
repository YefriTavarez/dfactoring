# Copyright (c) 2013, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def execute(filters=None):
	return get_columns(filters), \
		get_data(filters)

def get_columns(filters=None):
	from frappe import _
	return [
		_("Portfolio") + ":Link/Party Portfolio:100",
		_("Invoice") + ":Link/Sales Invoice:100",
		_("Customer") + ":Link/Customer:180",
		_("Posting") + " Date:Date:100",
		_("Due Date") + ":Date:100",
		_("Base Grand Total") + ":Currency:100",
		_("Received Amount") + ":Currency:100",
		_("Outstanding Amount") + ":Currency:100"
	]

def get_data(filters=None):
	from frappe import db

	conditions = get_conditions(filters)

	return db.sql("""
		Select
			`tabParty Portfolio`.name As portfolio,
			`tabSales Invoice`.name As invoice,
			`tabSales Invoice`.customer,
			`tabSales Invoice`.posting_date,
			`tabSales Invoice`.due_date,
			`tabSales Invoice`.base_grand_total,
			`tabSales Invoice`.base_grand_total - 
			(
				(
					`tabSales Invoice`.outstanding_amount 
						- `tabSales Invoice`.rounding_adjustment
				) * `tabSales Invoice`.conversion_rate
			) As received_amount,
			`tabSales Invoice`.outstanding_amount
		From
			`tabCase File`
		Inner Join
			`tabParty Portfolio`
			On
			`tabCase File`.parent = `tabParty Portfolio`.name
			And `tabCase File`.parenttype = "Party Portfolio"
			And `tabCase File`.parentfield = "detail"
		Inner Join
			`tabSales Invoice`
			On
			`tabCase File`.invoice = `tabSales Invoice`.name
		Where
			{conditions}
	""".format(conditions=conditions), 
	filters, debug=True)

def get_conditions(filters=None):
	conditions = ["`tabSales Invoice`.`docstatus` = 1"]

	if filters.get("company"):
		conditions += ["`tabSales Invoice`.`company` = %(company)s"]

	if filters.get("portfolio"):
		conditions += ["`tabParty Portfolio`.`name` = %(portfolio)s"]

	return " And ".join(conditions)