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
    }
}