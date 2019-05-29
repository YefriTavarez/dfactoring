// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

class ShowTodaysPendingsPrompt {
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
		this.set_widther_view();
		this.hide_primary_btn();
		this.setup_handlers();
	}

	set_widther_view() {
		this.prompt.$wrapper.find(".modal-dialog")
			.css({ "width": "90%" });
	}

	hide_primary_btn() {
		this.prompt.get_primary_btn()
			.hide();
	}
	
	hide() {
		this.prompt.hide();
	}

	show() {
		this.prompt.show();
	}

	get_parent_table() {
		const { prompt } = this;

		return prompt.$wrapper
			.find("div[data-fieldname=rows]");
	}

	setup() {
		this.setup_fields();
		this.setup_title();
		this.setup_primary_label();
		this.setup_callback();
	}

	setup_fields() {
		this.fields =  [
			{
				fieldtype: "HTML",
				fieldname: "rows",
				label: __("Logs"),
				reqd: true,
			},
		];
	}

	setup_title() {
		this.title = __("Pending Tasks for Today");
	}

	setup_primary_label() {
		this.primary_label = __("Add");
	}

	setup_callback() {
		this.callback = opts => {
            // todo
        };
	}

	setup_handlers() {
        // todo
	}
}
