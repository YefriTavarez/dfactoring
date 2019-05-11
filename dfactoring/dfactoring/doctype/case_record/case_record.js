// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Case Record', {
	setup: frm => {
		frm.trigger("run_setup_methods");
	},
	refresh: frm => {
		frm.trigger("run_refresh_methods");
	},
	onload_post_render: frm => {
		frm.trigger("run_onload_post_render_methods");
	},
	run_setup_methods: frm => {
		// pass
	},
	run_refresh_methods: frm => {
		$.map([
			"toggle_read_only_form",
		], event => frm.trigger(event));
	},
	run_onload_post_render_methods: frm => {
		$.map([
			"set_queries",
			"set_defaults",
			"set_specify_contact_mean_label",
			"set_speficy_next_contact_mean_label",
		], event => frm.trigger(event));
	},
	set_queries: frm => {
		$.map([
			"set_activity_option_query",
		], event => frm.trigger(event));
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
		const { doc } = frm,
		{ boot, datetime } = frappe,
		{ sysdefaults } = boot,
		{ add_days } = datetime,
		{ case_record_status } = sysdefaults;

		// for parent doc
		$.each({
			"status": case_record_status,
			"next_contact_date": add_days(doc.transaction_date, 1),
		}, (fieldname, defvalue) => {
			if (!doc[fieldname]) {
				frm.set_value(fieldname, defvalue);
			}
		});
	},
	set_defaults_in_children: frm => {
		const { doc } = frm;

		// for child table
		$.each({
			// empty
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
	toggle_read_only_form: frm => {
		const { doc } = frm;

		if (frm.is_new()) {
			return false;
		}

		$.each(frm.doc, fieldname => {
			frm.toggle_enable(fieldname,
			    !doc.read_only_form);
		});
	},
	specify_contact_mean: frm => {
		const { doc } = frm;

		frm.trigger("set_specify_contact_mean_label");

		frm.set_value("speficy_next_contact_mean",
        	doc.specify_contact_mean);

		// clear the dependant field
		frm.set_value("contact_mean", undefined);
	},
	speficy_next_contact_mean: frm => {
		frm.trigger("set_speficy_next_contact_mean_label");

		// clear the dependant field
		frm.set_value("next_contact_mean", undefined);
	},
	set_specify_contact_mean_label: frm => {
		const { doc } = frm;

		frm.set_df_property("contact_mean",
			"label", __(doc.specify_contact_mean));

		// Possible values
		//
		// Contact Number
		// Contact Email
		// Other Mean

		if (doc.specify_contact_mean == "Contact Number") {
			frm.set_df_property("contact_mean", "options", "Phone");
		} else if (doc.specify_contact_mean == "Contact Email") {
			frm.set_df_property("contact_mean", "options", "Email");
		} else {
			// pass
		}

		frm.refresh_fields();
	},
	set_speficy_next_contact_mean_label: frm => {
		const { doc } = frm;

		frm.set_df_property("next_contact_mean",
			"label", __(doc.speficy_next_contact_mean));

		// Possible values
		//
		// Contact Number
		// Contact Email
		// Other Mean

		if (doc.speficy_next_contact_mean == "Contact Number") {
			frm.set_df_property("next_contact_mean", "options", "Phone");
		} else if (doc.speficy_next_contact_mean == "Contact Email") {
			frm.set_df_property("next_contact_mean", "options", "Email");
		} else {
			// pass
		}

		frm.refresh_fields();
	},
	set_activity_option_query: frm => {
		const { doc } = frm;

		frm.set_query("activity_option", event => {
			return {
				filters: {
					"activity_type": doc.activity_type || "None",
				}
			};
		});
	},
	contact_mean: frm => {
		// pass
	},
	next_contact_mean: frm => {
		// pass
	},
	copy_paste_next_date: frm => {
		const { doc } = frm;

		$.each({
			"speficy_next_contact_mean": doc.specify_contact_mean,
			"next_contact_mean": doc.contact_mean,
		}, (fieldname, value) => {
			frm.set_value(fieldname, value);
		});

	},
});
