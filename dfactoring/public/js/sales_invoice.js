// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.ui.form.on("Sales Invoice", {
	generate_bill_number: frm => {
        const { doc } = frm;
        
        if (doc.bill_no) {
            frm.trigger("handle_existing_bill_no");
            
            return false;
        }

        frm.trigger("handle_generate_bill_number");
        
    },
    handle_generate_bill_number: frm => {
        const { doc } = frm,
            title = __("Select the Naming Series"),
            primary_label = __("Generate  Bill Number"),
            fields = {
                fieldtype: "Link",
                fieldname: "serie",
                options: "Tax Receipt Management",
                label: __("Naming Series"),
                reqd: true,
                get_query: function() {
                    return {
                        filters: {
                            company: doc.company,
                        }
                    }
                },
            },
            callback = ({ serie }) => {
                doc.serie = serie;
                frm.trigger("make_call_for_new_bill_no");
            };

        frappe.prompt(fields, callback, title, primary_label);
    },
    make_call_for_new_bill_no: frm => {
        const { doc } = frm;

        let opts = {
            method: "dfactoring.api.generate_new_bill_no",
        };

        opts.args = {
            serie: doc.serie,
            company: doc.company,
            doctype: doc.doctype,
            name: doc.name,
        };

        opts.callback = function(response) {
            const { message } = response;

            if (message) {
                frappe.model.sync(message);
                frm.refresh();
            }
        };

        frappe.call(opts);
    },
    handle_existing_bill_no: frm => {
        const message_part_1 = __("This Invoice already has a Bill Number."),
            message_part_2 = __("It will be lost if you continue."),
            message_part_3 = __("Are you sure you want to continue?"),
            message = `${message_part_1} ${message_part_2} ${message_part_3}`,
            ifyes = function() {
                frm.trigger("handle_generate_bill_number");
            },
            ifno = function() {
                frappe.show_alert(__("No changes were made"));
            };

        frappe.confirm(message, ifyes, ifno);
	},
});
