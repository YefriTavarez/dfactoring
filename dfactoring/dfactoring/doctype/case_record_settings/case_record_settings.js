// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Case Record Settings', {
	onload: frm => {
		frm.trigger("run_onload_methods");
	},
	run_onload_methods: frm => {
		$.map([
			"set_user_query",
		], event => {
			frm.trigger(event);
		});
	},
	set_user_query: frm => {
		const { doc } = frm;

		frm.set_query("user", "users", function(frm, cdt, cdn) {
			return {
				query: "dfactoring.queries.user_query",
				filters: {
					"`tabRole`.`role`": "Collector User",
					"ignore_list": $.grep(doc.users, row => row.user)
						.map(row => row.user),
				}
			}
		});
	}
});
