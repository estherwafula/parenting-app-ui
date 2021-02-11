import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'scripts/node_modules/rxjs';
import { FlowTypes } from '../../model';
import { TEMPLATE } from '../../services/data/data.service';

@Component({
  selector: 'plh-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
})
export class TemplateComponent implements OnChanges {

  @Input() template: FlowTypes.Template;

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.template) {
      this.onTemplateChange();
    }
  }

  private onTemplateChange() {
    if (!this.template.$local_variables) {
      this.template.$local_variables = new BehaviorSubject({});
    }
    console.log("Template input is ", this.template);
  }

  public keys(obj: any) {
    if (obj) {
      return Object.keys(obj);
    }
    return [];
  }

}

