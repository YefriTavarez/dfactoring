// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Case Record Status', {
	refresh: frm => {
		// $.map(["set_mask_indicator"], frm.trigger.bind(frm));
	},
	set_mask_indicator: frm => {
		const fieldname = "indicator",
			{ meta } = frappe,
			{ get_field } = meta,
			{ options } = get_field(frm.doctype, fieldname),
			{ events } = frm,
			{ get_options } = events,
			opts = options.split("\n");

		frm.set_df_property(fieldname, "options",
			get_options({ frm, opts }));
	},
	get_options: args => {
		const { frm, opts } = args,
			{ events } = frm,
			{ get_option } = events;

		return opts.map(get_option.bind({ frm }));
	},
	get_option: value => {
		const { frm } = this,
			{ events } = frm,
			{ get_options_in_capital } = events,
			label = get_options_in_capital(value);

		return { label, value };
	},
	get_options_in_capital: option => {
		return option
			.charAt(0)
			.toUpperCase()
			.concat(option.slice(1));
	},
	enabled: frm => {
		const { doc } = frm;

		if (!doc.enabled) {
			frm.set_value("default", false);
		}
	},
	default: frm => {
		frm.save("Save");
	},
});
