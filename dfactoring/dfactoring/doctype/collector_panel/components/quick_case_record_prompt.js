// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

class QuickCaseRecordPrompt {
	constructor(frm) {
		this.frm = frm;
		this.setup();
		this.make();
	}

	make() {
		const {
			fields,
			title,
			primary_label,
			callback,
		} = this;

		this.prompt =
			frappe.prompt(fields, callback,
				title, primary_label);

		// this has to be done
		// after prompt creation
		this.setup_queries();
		this.setup_handlers();
	}

	hide() {
		this.prompt.hide();
	}

	show() {
		this.prompt.show();
	}

	setup() {
		this.setup_fields();
		this.setup_title();
		this.setup_primary_label();
		this.setup_callback();
	}

	setup_fields() {
		const { frm } = this;

		this.fields =  [
			{
				fieldtype: "Link",
				fieldname: "activity_type",
				options: "Case Record Activity Type",
				label: __("Activity Type"),
				reqd: true,
			},
			{
				fieldtype: "Link",
				fieldname: "activity_option",
				options: "Case Record Activity Option",
				label: __("Activity Option"),
				reqd: true,
			},
			{
				fieldtype: "Small Text",
				fieldname: "notes",
				label: __("Notes"),
				reqd: true,
			},
			{
				fieldtype: "MultiSelect",
				fieldname: "contact_mean",
				label: __("Contact Mean"),
				options: this.frm.customer_numbers || [],
				default: (this.frm.customer_numbers
					&& this.frm.customer_numbers[0]) || "-",
				reqd: true,
			},
			{
				fieldtype: "Date",
				fieldname: "next_contact_date",
				label: __("Next Contact Date"),
			},
		];
	}

	setup_title() {
		this.title = __("New Case Record");
	}

	setup_primary_label() {
		this.primary_label = __("Add");
	}

	setup_callback() {
		this.callback = opts => {
			this.save_case_record(opts);
		};
	}

	setup_queries() {
		const { prompt } = this,
			activity_option_field =
				prompt.get_field("activity_option"),
			activity_type_field =
				prompt.get_field("activity_type");

		activity_option_field.get_query = event => {
			return {
				filters: {
					activity_type: activity_type_field.get_value(),
				}
			};
		}
	}

	setup_handlers() {
		this.setup_activity_type_handlers();
		this.setup_next_contact_date_handlers();
	}

	setup_activity_type_handlers() {
	
		// setup activity_type handler
		const { prompt } = this,
			activity_option_field =
				prompt.get_field("activity_option"),
			activity_type_field =
				prompt.get_field("activity_type");

		activity_type_field.df.change = event => {
			activity_option_field.set_value("");
		};
	}

	setup_next_contact_date_handlers() {
		// setup next_contact_date handler
		const { prompt } = this,
			next_contact_date_field = 
				prompt.get_field("next_contact_date");

		next_contact_date_field.df.change = event => {
			const { datetime } = frappe,
				{ nowdate } = datetime,
				next_contact_date = 
					next_contact_date_field.get_value();

			if (isntset(next_contact_date)) {
				return false; // don't validate empty values
			}

			if (cstr(next_contact_date) <= nowdate()) {
				// empty field
				next_contact_date_field.set_value("");

				// let the user know
				frappe.throw(__("Next Contact Date must be in the future"));
			}
		};
	}

	save_case_record(opts) {
		const { frm } = this, {
			activity_type,
			activity_option,
			notes,
			contact_mean,
		} = opts, {
			customer,
		} = frm.doc;

		let { next_contact_date } = opts;

		if (!next_contact_date) {
			const { datetime } = frappe,
				{ nowdate } = datetime;

			next_contact_date = nowdate();
		}

		frappe.call({
			method: "frappe.desk.form.save.savedocs",
			args: {
				action: "Save",
				doc: {
					customer,
					activity_type,
					activity_option,
					notes,
					next_contact_date,
					contact_mean,
					doctype: "Case Record",
					reference_type: "Case File",
					status: __("Open"),
					reference_name: frm.doc.record,
					transaction_date: frappe.datetime.nowdate(),
					next_contact_mean: contact_mean,
				}
			},
			callback: response => {
				const { docs } = response;

				if ($.isArray(docs) && docs.length) {
					this.handle_reload_log();
				}
			}
		});
	}

	handle_reload_log() {
		frappe.show_alert({
			message: __("Case Record has been created"),
			indicator: "green",
		});

		this.reload_log();
	}

	reload_log() {
		const { frm } = this;

		frm.trigger("render_log_table");
	}
}

