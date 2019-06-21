// Copyright (c) 2019, Yefri Tavarez and contributors
// For license information, please see license.txt

frappe.provide("dfactoring");

class Menu {
	constructor(frm) {
		this.frm = frm;
		this.setup(frm.page);
	}

	setup(page) {
		// self page asignment
		this.page = page;

		// run standard setups
		frappe.run_serially([
			() => this.add_std_menu_items(),
			() => this.show_menu(),
		]);
	}

	add_std_menu_items() {
		$.map([
			"add_show_pending_tasks",
		], method => {
			this[method]();
		});
	}

	add_show_pending_tasks() {
		const { page } = this;

		page.add_menu_item(__("Today's Pendings"), event => {
			this.show_todays_pendings();
		}, false);
	}

	show_menu() {
		const { page } = this;

		page.show_menu();
	}

	show_todays_pendings(event) {
		const { frm } = this;

		frm.call("fetch_daily_reminders", {
			// pass
		}, response => {
			const {
				message = [],
			} = response;

			if (message) {
				this.render_pendings_table(message);
			}
		});

		this.prompt = new ShowTodaysPendingsPrompt(frm);
		window["showtodayspendingsprompt"] = this.prompt;
	}

	render_pendings_table(rows) {
		const { model } = frappe,
			{ unscrub } = model,
			{ prompt } = this,
			ignore_list = [
				"name",
				"activity_type",
				"activity_option",
				"status",
				"next_contact_mean",
				"reference_type",
				"reference_name",
			];

		if (isempty(rows)) {
			const msg = `<center>
				${__("No pending tasks")}
			</center>`;

			get(prompt.get_parent_table())
				.html(msg);

			return false;
		}

		let container = new Container(prompt.get_parent_table());
		let table = new Table(container);
		let theader = new TableHeader(table);
		let tbody = new TableBody(table);

		let trow = new TableRow(theader);

		for (const label in rows[0]) {
			if (ignore_list.includes(label)) {
				continue;
			}

			new TableHeaderCell(trow,
				unscrub(label));
		}

		new TableHeaderCell(trow, __("Actions"));

		$.map(rows, row => {
			let trow = new TableRow(tbody);

			const {
				name,
				reference_type,
				reference_name,
				activity_type,
				activity_option,
				notes,
				next_contact_mean,
			} = row;

			$.map(row, (value, label) => {
				if (ignore_list.includes(label)) {
					return false;
				}

				new TableBodyCell(trow, value);
			});

			const btn_group =
				new ButtonGroup(trow.element, event => {
					// do nothing
				}, __("Actions"));

			let loadbtn = new Button(btn_group.element, __("Load"), event => {
				if (reference_type != "Case File") {
					return false;
				}

				this.prompt.hide();

				this.frm.set_value("record",
					reference_name);

				setTimeout(event => {
					this.frm.fields_dict.record
						.validate(reference_name);
				}, 200);

			}, "btn btn-default btn-sm btn-close");


			new Button(btn_group.element, __("View"), event => {

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
						<td><b>${ __("Next Contact Mean") }</b></td>
						<td>${next_contact_mean}</td>
					</tr>
				</table>`, __("More Info"));
			}, "btn btn-primary btn-sm");

			let closebtn = new Button(btn_group.element, __("Close"), event => {
				let { target } = event;

				frappe.db.set_value("Case Record",
					name, "status", __("Closed"));

				get(target)
					.hide();

				get("button.btn.btn-danger.btn-sm.btn-open")
					.show();
			}, "btn btn-success btn-sm btn-close");

			let reopenbtn = new Button(btn_group.element, __("Re-Open"), event => {
				let { target } = event;

				frappe.db.set_value("Case Record",
					name, "status", __("Open"));

				get(target)
					.hide();

				get("button.btn.btn-success.btn-sm.btn-close")
					.show();

			}, "btn btn-danger btn-sm btn-open");

			closebtn.toggle_display(row.status != __("Closed"));
			reopenbtn.toggle_display(row.status == __("Closed"));

			new TableBodyCell(trow, btn_group);
		});
	}
}

// dfactoring.page.set_primary_action(__("New Case"), event => {
//   // pass
// }, "fa fa-check-square", __("Wait"));


// dfactoring.page.add_field({
// 	fieldtype: "Link",
// 	fieldname: "customer",
// 	label: "Customer",
// 	options: "Customer",
// 	change: event => {
// 		console.log(event);
//     }
// });

// dfactoring.page.set_secondary_action(__("Reload"), event => {
// 	for (i = 1; i < 10000; i ++) {
// 		console.log("eo");
//     }
// }, "fa fa-refresh", __("Reloading"));

// $(dfactoring.page.page_form)
// 	.append(`<div class="container-fluid"></div>`);

// frappe.ui.form.make_control({
// 	parent: $(dfactoring.page.page_form).find(".container-fluid"),
// 	df: {
// 		fieldtype: "Link",
// 		fieldname: "customer",
// 		options: "Customer",
// 		label: "Customer",
//     },
// 	render_input: true,
// });

// dfactoring.page.show_form();
