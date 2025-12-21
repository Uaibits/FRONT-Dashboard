  import {Component} from '@angular/core';
  import {ModalRef} from '../modal/modal.service';
  import {DynamicQueryComponent} from '../../components/dynamic-query/dynamic-query.component';
  import {DynamicQueryService} from '../../services/dynamic-query.service';

  @Component({
    imports: [
      DynamicQueryComponent
    ],
    template: `
      <app-dynamic-query [dynamicQueryKey]="dynamicQueryKey"></app-dynamic-query>
    `,
    standalone: true
  })
  export class DynamicQueryModal {
    dynamicQueryKey!: string;
    loading: boolean = false;
    modalRef!: ModalRef;



  }
