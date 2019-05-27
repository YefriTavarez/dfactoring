// Copyright (c) 2019, Yefri Tavarez and Contributors
// License: GNU General Public License v3. See license.txt

frappe.provide("dfactoring");

frappe.pages['collector-panel'].on_page_load = function(wrapper) {
	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Collector Panel'),
		single_column: true
	});

	dfactoring.page = page;

	new Menu(page);

	frappe.breadcrumbs.add("DFactoring");
};

class Menu {
	constructor(page) {
		this.setup(page);
	}

	setup(page) {
		// self page asignment
		this.page = page;

		// run standard setups
		frappe.run_serially([
			() => this.add_std_menu_items(),
			() => this.show_menu(),
		]);
	}

	add_std_menu_items() {
		const { page } = this;

		$.each({
			"Greet": this.handle_greet,
		}, (label, action) => {
			page.add_menu_item(__(label),
				action, true);
		});
	}

	show_menu() {
		const { page } = this;

		page.show_menu();
	}

	handle_greet(event) {
		console.log(event);

		frappe.msgprint(__("Hello there!"))
	}
}

// dfactoring.page.set_primary_action(__("New Case"), event => {
//   // pass
// }, "fa fa-check-square", __("Wait"));


// dfactoring.page.add_field({
// 	fieldtype: "Link",
// 	fieldname: "customer",
// 	label: "Customer",
// 	options: "Customer",
// 	change: event => {
// 		console.log(event);
//     }
// });

// dfactoring.page.set_secondary_action(__("Reload"), event => {
// 	for (i = 1; i < 10000; i ++) {
// 		console.log("eo");
//     }
// }, "fa fa-refresh", __("Reloading"));
