# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "dfactoring"
app_title = "D'Factoring"
app_publisher = "Yefri Tavarez"
app_description = "A standardized applications for factoring handling"
app_icon = "fa fa-microchip"
app_color = "#d9534f"
app_email = "yefritavarez@tzcode.tech"
app_license = "General Public License, v3"

# App fixtures
# ------------
fixtures = [
	{
		"doctype": "Custom Field",
		"filters": {
			"name": (
				"in", (
					"Case Record-status",
					"Sales Invoice-generate_bill_number",
					"Sales Invoice-bill_date",
					"Sales Invoice-bill_date_cb",
					"Sales Invoice-bill_no",
					"Sales Invoice-tax_receipt_details",
					"Purchase Invoice-party_portfolio",
				)
			)
		},
	},
	{
		"doctype": "Workflow State",
		"filters": {
			"name": (
				"in", (
					"Cerrado",
					"Pagado",
					"Asignado",
					"En Proceso",
					"En Negociacion",
					"Abierto",
				)
			)
		},
	},
	{
		"doctype": "Workflow Action",
		"filters": {
			"name": (
				"in", (
					"Marcar como Pagado",
					"En Negociacion",
					"Procesar",
					"Procesado",
					"Asignar",
					"Re-Abrir",
					"Cerrar",
				)
			)
		},
	},
	{
		"doctype": "Role",
		"filters": {
			"name": (
				"in", (
					"Collector User",
					"Collector Manager",
				)
			)
		},
	},
	{
		"doctype": "Property Setter",
		"filters": {
			"name": (
				"in", (
					"Sales Invoice-read_only_onload",
					"Workflow Action-allow_rename",
					"Workflow State-allow_rename",
					"Case File-read_only_onload",
				)
			)
		},
	},
	{
		"doctype": "Workflow",
		"filters": {
			"name": (
				"in", (
					"Case Record Workflow",
				)
			)
		},
	},
]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/dfactoring/css/dfactoring.css"
# app_include_js = "/assets/dfactoring/js/dfactoring.js"

# include js, css files in header of web template
# web_include_css = "/assets/dfactoring/css/dfactoring.css"
# web_include_js = "/assets/dfactoring/js/dfactoring.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
	"Sales Invoice" : "public/js/sales_invoice.js"
}

# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "dfactoring.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "dfactoring.install.before_install"
# after_install = "dfactoring.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "dfactoring.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"dfactoring.tasks.all"
# 	],
# 	"daily": [
# 		"dfactoring.tasks.daily"
# 	],
# 	"hourly": [
# 		"dfactoring.tasks.hourly"
# 	],
# 	"weekly": [
# 		"dfactoring.tasks.weekly"
# 	]
# 	"monthly": [
# 		"dfactoring.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "dfactoring.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "dfactoring.event.get_events"
# }

boot_session = "dfactoring.bootstrap.bootup"
