import {Component, OnDestroy, OnInit} from '@angular/core';
import {TableComponent, TableConfig} from '../../components/table/table.component';
import {ContentComponent} from '../../components/content/content.component';

@Component({
  selector: 'app-users',
  imports: [
    TableComponent,
    ContentComponent
  ],
  templateUrl: './users.page.html',
  standalone: true,
  styleUrl: './users.page.scss'
})
export class UsersPage implements OnInit, OnDestroy {

  ngOnInit() {
    console.log('UsersPage initialized');
  }

  ngOnDestroy() {
    console.log('UsersPage destroyed');
  }

  data = [
    {
      company: {name: 'Empresa A', year: 2020},
      user: {name: 'Carlos Silva', year: 1990},
      content: {name: 'Produto X', year: 2022}
    },
    {
      company: {name: 'Empresa B', year: 2019},
      user: {name: 'Ana Souza', year: 1985},
      content: {name: 'Serviço Y', year: 2021}
    },
    {
      company: {name: 'Empresa C', year: 2018},
      user: {name: 'Marcos Lima', year: 1992},
      content: {name: 'Produto Z', year: 2020}
    },
    {
      company: {name: 'Empresa D', year: 2017},
      user: {name: 'Fernanda Alves', year: 1994},
      content: {name: 'Serviço W', year: 2019}
    },
    {
      company: {name: 'Empresa E', year: 2016},
      user: {name: 'Roberto Nunes', year: 1988},
      content: {name: 'Produto V', year: 2018}
    },
    {
      company: {name: 'Empresa F', year: 2015},
      user: {name: 'Julia Castro', year: 1991},
      content: {name: 'Serviço U', year: 2017}
    },
    {
      company: {name: 'Empresa G', year: 2021},
      user: {name: 'Daniel Borges', year: 1987},
      content: {name: 'Produto T', year: 2016}
    },
    {
      company: {name: 'Empresa H', year: 2014},
      user: {name: 'Patrícia Mendes', year: 1995},
      content: {name: 'Serviço S', year: 2015}
    },
    {
      company: {name: 'Empresa I', year: 2022},
      user: {name: 'Gustavo Ferreira', year: 1993},
      content: {name: 'Produto R', year: 2014}
    },
    {
      company: {name: 'Empresa J', year: 2013},
      user: {name: 'Carla Martins', year: 1996},
      content: {name: 'Serviço Q', year: 2013}
    },
    {
      company: {name: 'Empresa K', year: 2012},
      user: {name: 'João Pedro', year: 1982},
      content: {name: 'Produto P', year: 2012}
    },
    {
      company: {name: 'Empresa L', year: 2011},
      user: {name: 'Sofia Andrade', year: 1989},
      content: {name: 'Serviço O', year: 2011}
    },
    {
      company: {name: 'Empresa M', year: 2010},
      user: {name: 'Ricardo Lopes', year: 1986},
      content: {name: 'Produto N', year: 2010}
    },
    {
      company: {name: 'Empresa N', year: 2009},
      user: {name: 'Luana Farias', year: 1997},
      content: {name: 'Serviço M', year: 2009}
    },
    {
      company: {name: 'Empresa O', year: 2008},
      user: {name: 'Thiago Costa', year: 1984},
      content: {name: 'Produto L', year: 2008}
    },
    {
      company: {name: 'Empresa P', year: 2007},
      user: {name: 'Vanessa Rocha', year: 1998},
      content: {name: 'Serviço K', year: 2007}
    },
    {
      company: {name: 'Empresa Q', year: 2006},
      user: {name: 'Eduardo Ramos', year: 1983},
      content: {name: 'Produto J', year: 2006}
    },
    {
      company: {name: 'Empresa R', year: 2005},
      user: {name: 'Bruna Santos', year: 1999},
      content: {name: 'Serviço I', year: 2005}
    },
    {
      company: {name: 'Empresa S', year: 2004},
      user: {name: 'Felipe Moura', year: 1981},
      content: {name: 'Produto H', year: 2004}
    },
    {
      company: {name: 'Empresa T', year: 2003},
      user: {name: 'Aline Carvalho', year: 2000},
      content: {name: 'Serviço G', year: 2003}
    },
    {
      company: {name: 'Empresa U', year: 2002},
      user: {name: 'Leonardo Ribeiro', year: 1979},
      content: {name: 'Produto F', year: 2002}
    },
    {
      company: {name: 'Empresa V', year: 2001},
      user: {name: 'Caroline Brito', year: 2001},
      content: {name: 'Serviço E', year: 2001}
    },
    {
      company: {name: 'Empresa W', year: 2000},
      user: {name: 'Henrique Neves', year: 1978},
      content: {name: 'Produto D', year: 2000}
    },
    {
      company: {name: 'Empresa X', year: 1999},
      user: {name: 'Natália Cunha', year: 2002},
      content: {name: 'Serviço C', year: 1999}
    },
    {
      company: {name: 'Empresa Y', year: 1998},
      user: {name: 'Rodrigo Pereira', year: 1977},
      content: {name: 'Produto B', year: 1998}
    },
    {
      company: {name: 'Empresa Z', year: 1997},
      user: {name: 'Amanda Lima', year: 2003},
      content: {name: 'Serviço A', year: 1997}
    }
  ];

  tableConfig: TableConfig = {
    cols: [
      {path: 'company.name', name: 'Nome da Empresa',},
      {path: 'company.year', name: 'Ano da Empresa'},
      {path: 'user.name', name: 'Nome do Usuário'},
      {path: 'user.year', name: 'Ano do Usuário'},
      {path: 'content.name', name: 'Nome do Conteúdo'},
      {path: 'content.year', name: 'Ano do Conteúdo'}
    ],
    selectable: true,
    showDeleteButton: true,
    showEditButton: true,
    showAddButton: true,
    showFilterButton: true,
  };

  onAdd(): void {
    console.log('Adicionar novo registro');
  }

  onEdit(item: any): void {
    console.log('Editar:', item);
  }

  onDelete(item: any): void {
    console.log('Excluir:', item);
  }

  onSelect(items: any[]): void {
    console.log('Itens selecionados:', items);
  }

}
