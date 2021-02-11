import { Component, Input, OnInit } from "@angular/core";
import { FlowTypes } from 'src/app/shared/model/flowTypes';

@Component({
  selector: "plh-tmpl-display-group",
  template: `<div class="display-group">
    <plh-tmpl-comp-host *ngFor="let childRow of row.rows" [row]="childRow" [template]="template"></plh-tmpl-comp-host>
  </div>`,
  styleUrls: ["./tmpl-components-common.scss"]
})
export class TmplDisplayGroupComponent {
  @Input() row: FlowTypes.TemplateRow;
  @Input() template: FlowTypes.Template;
}