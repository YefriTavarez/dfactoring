# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

from frappe import _

def get_data():
	return [
		{
			"label": _("Sales Pipeline"),
			"icon": "fa fa-star",
			"items": [
				{
					"type": "doctype",
					"name": "Party Portfolio",
					"description": _("Database of all receivables bought."),
				},
				{
					"type": "doctype",
					"name": "Case File",
					"description": _("Detail of each Portfolio by Customer"),
				},
			]
		},
		{
			"label": _("Reports"),
			"icon": "fa fa-list",
			"items": [
				{
					"type": "report",
					"is_query_report": True,
					"name": "Income by Portfolio",
					"doctype": "Lead"
				},
			]
		},
		{
			"label": _("Communication"),
			"icon": "fa fa-star",
			"items": [
				{
					"type": "doctype",
					"name": "Case Record",
					"description": _("Record of all communications of type email, phone of Customers"),
				},
			]
		},
		{
			"label": _("Setup"),
			"icon": "fa fa-cog",
			"items": [
				{
					"type": "doctype",
					"name": "Case Record Settings User",
					"description": _("Record of all Collector Users for activity asignments."),
				},
			]
		},
	]
