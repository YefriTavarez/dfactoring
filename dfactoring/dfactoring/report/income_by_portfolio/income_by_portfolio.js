// Copyright (c) 2016, Yefri Tavarez and contributors
// For license information, please see license.txt
/* eslint-disable */

(function() {
	const { boot } = frappe,
	{ sysdefaults } = boot;
	
	frappe.query_reports["Income by Portfolio"] = {
		"filters": [
			{
				fieldtype: "Link",
				fieldname: "company",
				options: "Company",
				label: __("Company"),
				default: sysdefaults["company"],
				reqd: true,
			},
			{
				fieldtype: "Link",
				fieldname: "portfolio",
				options: "Portfolio",
				label: __("Portfolio"),
			},
		]
	};	
})();