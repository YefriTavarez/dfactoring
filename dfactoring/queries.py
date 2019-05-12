# -*- coding: utf-8 -*-
# Copyright (c) 2019, Yefri Tavarez and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe

def user_query(doctype, txt, searchfield, start, page_len, filters):
	STANDARD_USERS = ["Guest", "Administrator"]

	from frappe.desk.reportview import get_match_cond

	user_type_condition = "And  `tabUser`.user_type = 'System User'"
	if filters and filters.get('ignore_user_type'):
		user_type_condition = ''

	if "ignore_list" in filters:
		for d in filters.get("ignore_list"):
			STANDARD_USERS += [d]

	txt = "%{}%".format(txt)
	return frappe.db.sql("""
		SELECT 
			`tabUser`.`name`, 
			Concat_Ws(' ', first_name, middle_name, last_name)
		From 
			`tabUser`
		Inner Join
			`tabHas Role`
			On
				`tabUser`.name = `tabHas Role`.parent
				And `tabHas Role`.parenttype = "User"
				And `tabHas Role`.parentfield = "roles"
		Where  `tabUser`.`enabled` = 1
			{user_type_condition}
			And `tabUser`.`docstatus` < 2
			And `tabUser`.`name` Not In %(standard_users)s
			And (`tabUser`.{key} Like %(txt)s
				Or Concat_Ws(' ', first_name, middle_name, last_name) Like %(txt)s)
			{mcond}
		Group By
			`tabUser`.name
		Order By
			Case When `tabUser`.`name` Like %(txt)s Then 0 Else 1 End,
			Case When Concat_Ws(' ', first_name, middle_name, last_name) Like %(txt)s
				Then 0 Else 1 End,
			`tabUser`.name asc
		Limit %(page_len)s Offset %(start)s""".format(
			user_type_condition = user_type_condition,
			# standard_users="', '".join([frappe.db.escape(u) for u in ]),
			key=searchfield, mcond=get_match_cond(doctype)),
			dict(start=start, page_len=page_len, txt=txt,
			standard_users=STANDARD_USERS))