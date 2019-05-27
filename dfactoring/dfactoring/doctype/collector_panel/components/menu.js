// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.provide("dfactoring");

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

$(dfactoring.page.page_form)
	.append(`<div class="container-fluid"></div>`);

frappe.ui.form.make_control({
	parent: $(dfactoring.page.page_form).find(".container-fluid"),
	df: {
		fieldtype: "Link",
		fieldname: "customer",
		options: "Customer",
		label: "Customer",
    },
	render_input: true,
});

dfactoring.page.show_form();
