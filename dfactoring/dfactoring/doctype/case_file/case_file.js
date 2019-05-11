// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Case File', {
	refresh: frm => {
		frm.trigger("run_refresh_methods");
	},
	onload_post_render: frm => {
		if (frm.is_new()) {
			frappe.show_not_permitted();
		}
	},
	run_refresh_methods: frm => {
		$.map([
			"add_custom_buttons",
		], event => frm.trigger(event));
	},
	add_custom_buttons: frm => {
		$.map([
			"add_view_case_record",
			"add_create_case_record",
		], event => frm.trigger(event));
	},
	add_view_case_record: frm => {
		const btn = __("Case Record"),
		onclick = event => {
			frm.trigger("handle_view_case_record");
		};

		frm.add_custom_button(btn, onclick, __("View"));
	},
	add_create_case_record: frm => {
		const btn = __("Case Record"),
		parent = __("Make"),
		onclick = event => {
			frm.trigger("handle_create_case_record");
		};

		frm.add_custom_button(btn, onclick, parent);
		frm.page.set_inner_btn_group_as_primary(parent);
	},
	handle_create_case_record: frm => {
		frm.call("create_new_case_record")
			.then(response => {
				const { message } = response;

				if (message) {
					frappe.model.sync(message);

					frappe.set_route("Form",
						message.doctype, message.name);
				}
			});
	},
	handle_view_case_record: frm => {
		const { doc } = frm;

		frappe.set_route("List", "Case Record", {
			"reference_type": doc.doctype,
			"reference_name": doc.name,
		});
	},
	inclusive_amount: frm => {
		frm.trigger("calculate_taxes_and_totals");
	},
	outstanding_amount: frm => {
		frm.trigger("calculate_taxes_and_totals");
	},
	discount_amount: frm => {
		frm.trigger("calculate_taxes_and_totals");
	},
	comission_rate: frm => {
		frm.trigger("calculate_taxes_and_totals");
	},
	tax_rate: frm => {
		frm.trigger("calculate_taxes_and_totals");
	},
	additional_fee: frm => {
		frm.trigger("calculate_taxes_and_totals");
	},
	calculate_taxes_and_totals: frm => {
		frm.call("validate")
			.then(response => {
				frappe.run_serially([
					() => frm.refresh(),
					() => frappe.timeout(0.5),
					() => frm.dirty(),
				]);
			});
	},
	delete_invoice: frm => {
		const message = __("This cannot be undone. Are you sure you want to continue?"),
		ifyes = event => {
			frm.trigger("_delete_invoice_button");
		},
		ifno = event => {
			frappe.show_alert(__("No changes were made!"));
		};

		frappe.confirm(message, ifyes, ifno);
	},
	_delete_invoice_button: frm => {
		const { doc } = frm,
		{ doctype, name } = doc;

		let opts = {
			"method": "dfactoring.api.delete_invoice",
		};

		opts.args = {
			cdt: doctype,
			cdn: name,
		};

		opts.callback = function(response) {
			const { message } = response;

			if (message) {
				frappe.run_serially([
					() => frappe.model.sync(message),
					() => frappe.show_alert(__("Invoice deleted successfully!")),
					() => frappe.timeout(1),
					() => frm.refresh(),
				]);
			}

		};

		frappe.call(opts);
	},
});
