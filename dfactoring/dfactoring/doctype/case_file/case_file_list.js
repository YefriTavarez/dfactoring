(function() {

    frappe.listview_settings["Case File"] = {
        onload: listview => {
            listview.page.add_menu_item(__("Randomly Assignment"), event => {
                const checked_items = listview.get_checked_items();
            
                let opts = {
                    method: "dfactoring.api.randomly_assign",
            };
            
            opts.args = {
                docs: checked_items.map(row => new Array(row.doctype, row.name)),
            };
            
            opts.callback = function(response) {
                listview.refresh();
            };
            
            if (!checked_items.length) {
                frappe.throw(__("Please select the items to be assigned"))
            }
            
            frappe.call(opts);
            
            }, false);
            
            setTimeout(function() {
                make_frappe_call(listview);
            }, 200);
        }
    }

    function make_frappe_call(list) {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Supplier",
                filters: {
                    disabled: 0,
                },
                fields: ["name As value", "supplier_name As label"],
                limit_page_length: 0,
                sort_by: "name Asc"
            },
            callback: response => {
                const { message } = response;
        
                if (message) {
                    let field = list.page.add_field({ 
                        label: __("Supplier"), 
                        fieldtype: "Select", 
                        fieldname: "supplier",
                        default: message[0].value,
                    });

                    field.$wrapper.find("select")
                        .empty()
                        .add_options(message)
                        .on("change", event => {
                            list.refresh();
                        });
                }
            },
        });
    }
})();