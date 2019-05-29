// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

class QuickPaymentEntryPrompt {
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
		const { frm } = this,
			{ doc } = frm,
			{ datetime } = frappe,
			{ nowdate } = datetime;

		this.fields =  [
			{
				fieldtype: "Link",
				fieldname: "customer",
				options: "Customer",
				label: __("Customer"),
				default: doc.customer,
				reqd: true,
			},
			{
				fieldtype: "Date",
				fieldname: "posting_date",
				label: __("Posting Date"),
				default: nowdate(),
			},
			{
				fieldtype: "Link",
				fieldname: "currency",
				options: "Currency",
				label: __("Currency"),
				default: doc.customer_currency,
				read_only: true,
				reqd: true,
			},
			{
				fieldtype: "Link",
				fieldname: "mode_of_payment",
				options: "Mode of Payment",
				label: __("Mode of Payment"),
				reqd: true,
			},
			{
				fieldtype: "Select",
				fieldname: "type",
				options: ["Cash","Bank","General"],
				label: __("Mode of Payment Type"),
				read_only: true,
			},
			{
				fieldtype: "Date",
				fieldname: "reference_date",
				label: __("Cheque/Reference Date"),
				depends_on: "eval:doc.type==\"Bank\"",
			},			
			{
				fieldtype: "Data",
				fieldname: "reference_no",
				label: __("Cheque/Reference No"),
				depends_on: "eval:doc.type==\"Bank\"",
			},
			{
				fieldtype: "Currency",
				fieldname: "paid_amount",
				label: __("Paid Amount"),
				reqd: true,
			},
		];
	}

	setup_title() {
		this.title = __("New Payment Entry");
	}

	setup_primary_label() {
		this.primary_label = __("Add");
	}

	setup_callback() {
		this.callback = opts => {
			this.save_payment_entry(opts);
		};
	}

	setup_handlers() {
		this.setup_paid_amount_handler();
		this.setup_mode_of_payment_handler();
	}

	setup_paid_amount_handler() {
		const { prompt } = this,
			paid_amount_field =
				prompt.get_field("paid_amount");

		paid_amount_field.df.change = event => {
			const { frm } = this,
				{ doc } = frm;

			if (
				paid_amount_field.get_value() 
					> flt(doc.invoice_outstanding_amount)
			) {

				paid_amount_field.set_value("");

				frappe.msgprint({
					message: __("Paid Amount cannot be greater than Outstanding Amount"),
					indicator: "red",
				});

				event.stopPropagation();
			}
		};
	}

	setup_mode_of_payment_handler() {
		const { prompt } = this,
			mode_of_payment_field =
				prompt.get_field("mode_of_payment");

		mode_of_payment_field.df.change = event => {
			// fetch mode of payment type
			this.fetch_mode_of_payment_type();
		};
	}

	fetch_mode_of_payment_type() {
		const { frm, prompt } = this,
			mode_of_payment_field = 
				prompt.get_field("mode_of_payment"),
			mode_of_payment_type_field = 
				prompt.get_field("type"),
			value = mode_of_payment_field.get_value();

		if (isntset(value)) {
			return false;
		}

		frappe.db.get_value("Mode of Payment", {
			name: value,
		}, ["type"], response => {
			const { type } = response;

			if (type) {
				mode_of_payment_type_field
					.set_value(type);

				this.toggle_required(cstr(type) == "Bank");
			}
		});
	}

	toggle_required(reqd) {
		const { prompt } = this,
		reference_date_field =
			prompt.get_field("reference_date"),
			
		reference_no_field = 
			prompt.get_field("reference_no");

		$.map([
			reference_date_field,
			reference_no_field,
		], field => {
			field.df.reqd = reqd;
			field.set_mandatory(reqd);
		});

		setTimeout(function() {
			prompt.refresh();
		}, 500);
	}

	save_payment_entry(opts) {
		const { frm } = this, { 
			paid_amount,
			reference_no,
			reference_date,
			mode_of_payment,
		} = opts, { 
			doc,
		} = frm;

		frm.call("make_payment_entry", {
			paid_amount,
			reference_no,
			reference_date,
			mode_of_payment,
		}, response => {
			const { docs } = response;

			if (docs) {
				frappe.show_alert({
					message: __("Payment Entry has been created"),
					indicator: "green",
				});
			}

			$.map([
				"invoice",
				"update_outstanding_amount",
			], event => {
				frm.trigger(event);
			});
		});
	}
}

