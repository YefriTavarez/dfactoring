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
				fieldname: "supplier",
				options: "Supplier",
				label: __("Supplier"),
			},
			{
				fieldtype: "Link",
				fieldname: "portfolio",
				options: "Party Portfolio",
				label: __("Party Portfolio"),
				get_query: event => {
					const { query_report_filters_by_name } = frappe,
					{ supplier } = query_report_filters_by_name;

					return {
						filters: {
							supplier: supplier.value,
						}
					};
				}
			},
		]
	};	
})();