import {DefaultCrudRepository} from '@loopback/repository';
import {Job, JobRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class JobRepository extends DefaultCrudRepository<
  Job,
  typeof Job.prototype.id,
  JobRelations
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Job, dataSource);
  }
}
