# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

from frappe import _

def get_data():
	return [
		{
			"module_name": "Case Record",
			"_doctype": "Case Record",
			"color": "#ffa00a",
			"icon": "fa fa-phone",
			"type": "list",
			"label": _("Case Record"),
			"link": "List/Case Record/List",
		},
		{
			"module_name": "Case File",
			"_doctype": "Case File",
			"color": "#d9534f",
			"icon": "fa fa-archive",
			"type": "list",
			"label": _("Case File"),
			"link": "List/Case File/List",
		},
		{
			"module_name": "Party Portfolio",
			"_doctype": "Party Portfolio",
			"color": "#935eff",
			"icon": "fa fa-briefcase",
			"type": "list",
			"label": _("Party Portfolio"),
			"link": "List/Party Portfolio/List",
		},
		{
			"module_name": "Tax Receipt Management",
			"_doctype": "Tax Receipt Management",
			"color": "#5e64ff",
			"icon": "fa fa-cog",
			"type": "list",
			"label": _("Tax Receipt Management"),
			"link": "List/Tax Receipt Management/List",
		},
		{
			"module_name": "Income by Portfolio",
			"_doctype": "Party Portfolio",
			"color": "#5e64ff",
			"icon": "fa fa-file-pdf-o",
			"type": "link",
			"label": _("Income by Portfolio"),
			"link": "query-report/Income by Portfolio",
		},
		{
			"module_name": "Collector Panel",
			"_doctype": "Party Portfolio",
			"color": "#98d85b",
			"icon": "fa fa-wpforms",
			"type": "link",
			"label": _("Collector Panel"),
			"link": "#Form/Collector Panel",
		},
	]
