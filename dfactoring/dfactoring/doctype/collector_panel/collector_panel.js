// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

{% include "dfactoring/dfactoring/doctype/collector_panel/components/import.js" %}

frappe.ui.form.on("Collector Panel", {
	onload_post_render: frm => {
		const record =
			find_get_parameter("record");

		if (record) {
			const fieldname = "record";

			frm.doc[fieldname] = record;

			frappe.run_serially([
				() => frappe.timeout(1.5),
				() => frm.trigger(fieldname),
			])
		}
	},
	refresh: frm => {
		frm.trigger("run_refresh_methods");
	},
	run_refresh_methods: frm => {
		$.map([
			"add_fetches",
			"add_custom_buttons",
			"set_queries",
			"disable_save",
			"show_menu",
		], event => {
			frm.trigger(event);
		});
	},
	show_menu: frm => {
		frm.menu = new Menu(frm);
	},
	record: frm => {
		const { dashboard, doc } = frm;

		if (!doc.record) {
			dashboard
				.set_headline("");
			return false;
		}

		$.map([
			"fetch_party_numbers",
			"render_log_table",
		], event => {
			frm.trigger(event);
		});

		frm.refresh();
	},
	customer: frm => {
		$.map([
			"update_outstanding_amount",
			"get_customer_currency",
		], event => {
			frm.trigger(event);
		});

	},
	get_customer_currency: frm => {
		const { doc } = frm,
			{ boot } = frappe,
			{ sysdefaults } = boot;

		frappe.call({
			method: "dfactoring.api.get_party_account_currency",
			args: {
				party_type: "Customer",
				party: doc.customer,
				company: sysdefaults["company"],
			},
			callback: response => {
				const { message } = response;

				if (message) {
					doc.customer_currency = message;
				}
			}
		});
	},
	update_outstanding_amount: frm => {
		const { dashboard, doc } = frm;

		frappe.call({
			method: "erpnext.accounts.utils.get_balance_on",
			args: {
				party_type: "Customer",
				party: frm.doc.customer,
			},
			callback: response => {
				const { message } = response;

				if (message) {
					const df = {
						fieldtype: "Currency"
					}, { format } = frappe,
					outstanding_message =
						__("<div style='text-align: right;'>Outstanding Amount</div> {0}",
							[format(message, df)]);

					doc.customer_balance = message;

					// empty the headline
					dashboard
						.set_headline("");

					dashboard
						.set_headline(outstanding_message);
				}
			}
		});
	},
	add_fetches: frm => {
		$.map([
			"add_case_record_fetch",
		], event => {
			frm.trigger(event);
		});
	},
	set_queries: frm => {
		$.map([
			"set_record_query",
		], event => {
			frm.trigger(event);
		});
	},
	add_custom_buttons: frm => {
		$.map([
			"add_make_payment_entry_button",
		], event => {
			frm.trigger(event);
		});
	},
	disable_save: frm => {
		frm.disable_save();
	},
	set_record_query: frm => {
		frm.set_query("record", event => {
			return {
				query: "dfactoring.queries.get_case_record_query",
				filters: [
					["Case File", "status", "!=", __("Closed")],
				]
			}
		});
	},
	add_make_payment_entry_button: frm => {
		const parent_group = __("Create"),
			{ doc } = frm;

		if (isntset(doc.invoice)) {
			return false; // there is not invoice yet
		}

		frm.add_custom_button(__("Income Receipt"), event => {
			frm.trigger("handle_make_payment_entry");
		}, parent_group);

		frm.page.set_inner_btn_group_as_primary(parent_group);
	},
	add_case_record_fetch: frm => {
		$.each({
			"customer": "customer",
			"temporary_opening_account": "temporary_opening_account",
			"posting_date": "posting_date",
			"due_date": "due_date",
			"item_name": "item_name",
			"outstanding_amount": "outstanding_amount",
			"qty": "qty",
			"comission_rate": "comission_rate",
			"comission_amount": "comission_amount",
			"tax_rate": "tax_rate",
			"tax_amount": "tax_amount",
			"discount_amount": "discount_amount",
			"inclusive_amount": "inclusive_amount",
			"additional_fee": "additional_fee",
			"grand_total": "grand_total",
			"invoice": "invoice",
			"user": "user"
		}, (source, target) => {
			frm.add_fetch("record", source, target);
		});
	},
	invoice: frm => {
		const { doc } = frm;

		if (doc.invoice) {
			// get_value(doctype, fieldname, filters=None, as_dict=True, debug=False, parent=None)
			frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: "Sales Invoice",
					fieldname: "outstanding_amount",
					filters: doc.invoice
				},
				callback: response => {
					const { message } = response;

					if (message) {
						frm.set_value("invoice_outstanding_amount",
							message["outstanding_amount"]);
					}
				}
			})
		}
	},
	render_log_table: frm => {
		const { doc } = frm;

		if (doc.record) {
			dfactoring
				.collector_panel
				.init(frm);
		}
	},
	handle_make_payment_entry: frm => {
		frm.quick_payment_entry_prompt =
			new QuickPaymentEntryPrompt(frm);

		// don't catch enter as submit
		frm.quick_payment_entry_prompt.prompt
			.has_primary_action = false;
	},
	fetch_party_numbers: frm => {
		const { doc } = frm;

		if (doc.customer) {
			frappe.call({
				method: "dfactoring.api.get_customer_phones",
				args: {
					customer: doc.customer,
				},
				callback: response => {
					const { message } = response;

					if (message) {
						frm.customer_numbers = message;
					}
				}
			})
		}
	},
});
frappe.provide("dfactoring.collector_panel");

$.extend(dfactoring.collector_panel, {
	init: function(frm) {
		this.frm = frm;
		this.setup(frm);
	},

	setup: function(frm) {
		let self = this,
			parent = get("div[data-fieldname=\"case_activity\"]").empty(),
			button_group = new ButtonGroup(parent),
			add_button = new Button(button_group.element, __("New Record"),
				event => this.handle_new_record(event), "btn btn-primary btn-xs"),
			reload_button = new Button(button_group.element, __("Reload"),
				event => this.handle_reload_log(event), "btn btn-secondary btn-xs"),
			wrapper = new LogTableWrapper(parent),
			table = new LogTable(wrapper.element),
			header = new LogHeader(table.element),
			hrow = new LogRow(header.element),
			h1 = new LogHeaderCell(hrow.element, __("Activity Type")),
			h2 = new LogHeaderCell(hrow.element, __("Activity Option")),
			h3 = new LogHeaderCell(hrow.element, __("Notes")),
			h4 = new LogHeaderCell(hrow.element, __("Contact")),
			body = new LogBody(table.element);

		frappe.call({
			method: "dfactoring.api.get_case_records",
			args: {
				case_file: this.frm.doc.record,
			},
			callback: response => {
				const { message } = response;

				if (message) {
					this.render_log_table(message, body);
				}
			}
		});
	},
	render_log_table: function(rows, body) {

		$.map(rows, row => {
			const {
				activity_type,
				activity_option,
				notes,
				contact_mean,
			} = row,
			body_row = new LogRow(body.element, event => {
				frappe.msgprint(`
					<h2>${__("Record Detail")}</h2>
					<table class="table table-striped">
					<tr>
						<td><b>${ __("Activity Type") }</b></td>
						<td>${activity_type}</td>
					</tr>
					<tr>
						<td><b>${ __("Activity Option") }</b></td>
						<td>${activity_option}</td>
					</tr>
					<tr>
						<td><b>${ __("Notes") }</b></td>
						<td>${notes}</td>
					</tr>
					<tr>
						<td><b>${ __("Contact Mean") }</b></td>
						<td>${contact_mean}</td>
					</tr>
				</table>`, __("More Info"));
			}),
			activity_type_cell = new LogBodyCell(body_row.element, activity_type),
			activity_option_cell = new LogBodyCell(body_row.element, activity_option),
			notes_cell = new LogBodyCell(body_row.element, notes),
			contact_mean_cell = new LogBodyCell(body_row.element, contact_mean);
		});
	},
	handle_reload_log: function(event) {
		const { frm } = this;

		frm.trigger("render_log_table");
	},
	handle_new_record: function(event) {
		const { frm } = this;

		this.quick_case_prompt =
			new QuickCaseRecordPrompt(frm);

		// don't catch enter as submit
		this.quick_case_prompt.prompt
			.has_primary_action = false;

	},
	save_case_record: function(opts) {
		const { frm } = this, {
			activity_type,
			activity_option,
			notes,
			contact_mean,
		} = opts, {
			customer,
		} = frm;

		frappe.call({
			method: "frappe.desk.form.save.savedocs",
			args: {
				action: "Save",
				doc: {
					customer,
					activity_type,
					activity_option,
					notes,
					contact_mean,
					reference_type: "Case File",
					reference_name: frm.doc.record,
					transaction_date: frappe.datetime.nowdate(),
					next_contact_mean: contact_mean,
				}
			},
			callback: response => {
				self.handle_reload_log({});
			}
		});
	}
});
