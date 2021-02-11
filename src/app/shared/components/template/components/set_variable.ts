import { Component, Input, OnInit } from "@angular/core";
import { BehaviorSubject } from "scripts/node_modules/rxjs";
import { FlowTypes } from "scripts/types";

@Component({
    selector: "plh-tmpl-animated-section-group",
    template: ``
})
export class TmplSetVariableComponent implements OnInit {

    @Input() row: FlowTypes.TemplateRow;
    @Input() template: FlowTypes.Template;

    ngOnInit() {
        console.log("Ng on init set variable", this.row, this.template);
        if (this.row && this.template) {
            if (!this.template.$local_variables) {
                this.template.$local_variables = new BehaviorSubject({});
            }
            const vars = this.template.$local_variables.getValue();
            vars[this.row.name] = this.row.value;
            this.template.$local_variables.next(vars);
        }
    }
}