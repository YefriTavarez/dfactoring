// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Party Portfolio', {
	setup: frm => {
		// pass
	},
	onload_post_render: frm => {
		frm.trigger("run_onload_post_render_methods");
	},
	refresh: frm => {
		// frm.disable_save();
		// frm.trigger("make_dashboard");
/* 		frm.page.set_primary_action(__("Make Invoices"), () => {
			let btn_primary = frm.page.btn_primary.get(0);
			return frm.call({
				doc: frm.doc,
				freeze: true,
				btn: $(btn_primary),
				method: "make_invoices",
				freeze_message: __("Creating {0} Invoice", [frm.doc.invoice_type]),
				callback: (r) => {
					if(!r.exc){
						frappe.msgprint(__("Opening {0} Invoice created", [frm.doc.invoice_type]));
						frm.clear_table("invoices");
						frm.refresh_fields();
						frm.reload_doc();
					}
				}
			});
		}); */
		frm.trigger("run_refresh_methods");
	},
	run_refresh_methods: frm => {
		$.map([
			"add_custom_buttons",
		], event => frm.trigger(event));
	},
	run_onload_post_render_methods: frm => {
		$.map([
			"set_defaults",
			"toggle_reqd_bill_date",
		], event => frm.trigger(event));
	},
	add_custom_buttons: frm => {
		$.map([
			"add_make_invoice_button",
		], event => frm.trigger(event));
	},
	add_make_invoice_button: frm => {
		const btn = __("Make Invoices"),
			onclick = event => {
				frm.trigger("handle_make_invoice_button");
			};

		frm.add_custom_button(btn, onclick);
	},
	bill_no: frm => {
		frm.trigger("toggle_reqd_bill_date");
	},
	toggle_reqd_bill_date: frm => {
		const { doc } = frm;

		frm.toggle_reqd("bill_date", doc.bill_no);
	},
	set_defaults: frm => {
		if (!frm.is_new()) {
			return false;
		}

		$.map([
			"set_defaults_in_parent",
			"set_defaults_in_children"
		], event => frm.trigger(event));
	},
	set_defaults_in_parent: frm => {
		const { doc } = frm;

		// for parent doc
		$.each({
			// empty
		}, (fieldname, defvalue) => {
			frm.set_value(fieldname, defvalue);
		});
	},
	set_defaults_in_children: frm => {
		const { doc } = frm;

		// for child table
		$.each({
			"item_name": __("Opening Invoice Item"),
		}, (fieldname, defvalue) => {
			$.map(doc.detail, d => {
				const { doctype, name } = d;

				if (doc[fieldname]) {
					return false;
				}

				frappe.model
					.set_value(doctype, name, fieldname, defvalue);
			});
		});
	},
	handle_make_invoice_button: frm => {
		const btn = frm.custom_buttons[__("Make Invoices")];

		return frm.call({
			doc: frm.doc,
			freeze: true,
			btn: $(btn),
			method: "make_invoices",
			freeze_message: __("Creating Sales Invoice"),
			callback: response => {
				if(!response.exec){
					frappe.show_alert(__("Opening Sales Invoice created"));
					frm.refresh();
				}
			}
		});
	},
	_company: frm => {
		frappe.call({
			method: 'erpnext.accounts.doctype.opening_invoice_creation_tool.opening_invoice_creation_tool.get_temporary_opening_account',
			args: {
				company: frm.doc.company
			},
			callback: (r) => {
				if (r.message) {
					frm.doc.__onload.temporary_opening_account = r.message;
					frm.trigger('update_invoice_table');
				}
			}
		})
	},

	make_dashboard: frm => {
		let max_count = frm.doc.__onload.max_count;
		let opening_invoices_summary = frm.doc.__onload.opening_invoices_summary;
		if(!$.isEmptyObject(opening_invoices_summary)) {
			let section = frm.dashboard.add_section(
				frappe.render_template('opening_invoice_creation_tool_dashboard', {
					data: opening_invoices_summary,
					max_count: max_count
				})
			);

			section.on('click', '.invoice-link', function() {
				let doctype = $(this).attr('data-type');
				let company = $(this).attr('data-company');
				frappe.set_route('List', doctype,
					{'is_opening': 'Yes', 'company': company, 'docstatus': 1});
			});
			frm.dashboard.show();
		}
	},

	update_invoice_table: frm => {
		$.each(frm.doc.invoices, (idx, row) => {
			if (!row.temporary_opening_account) {
				row.temporary_opening_account = frm.doc.__onload.temporary_opening_account;
			}
		});
	},
	calculate_taxes_and_totals: frm => {
		frm.call("validate")
			.then(response => {
				frm.refresh();
				frm.dirty();
			});
	},
});

frappe.ui.form.on('Case File', {
	detail_add: frm => {
		frm.trigger('set_defaults_in_children');
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
	delete_invoice: (frm, cdt, cdn) => {
		const message = __("This cannot be undone. Are you sure you want to continue?"),
		ifyes = event => {
			const { script_manager } = frm;

			script_manager
				.trigger("_delete_invoice_button",
					cdt, cdn);
		},
		ifno = event => {
			frappe.show_alert(__("No changes were made!"));
		};

		frappe.confirm(message, ifyes, ifno);
	},
	_delete_invoice_button: (frm, cdt, cdn) => {
		let opts = {
			"method": "dfactoring.api.delete_invoice",
		};

		opts.args = {
			cdt, cdn
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
