import { Model } from 'mongoose';
import { Deleted, DeletedMethods, DeletedQueryHelpers, DeletedStaticMethods } from '../source';
import { describe } from 'mocha';
import setupModel from './utils/setupModel';
import dropModel from './utils/dropModel';
import { expect } from 'chai';

type Test = { name: string } & Deleted;
type TestQueryHelpers = DeletedQueryHelpers<Test>;
type TestModel = Model<Test, TestQueryHelpers, DeletedMethods> & DeletedStaticMethods<Test, TestQueryHelpers>;

describe('with type key', function() {
	let TestModel: TestModel;

	before(async function() {
		TestModel = setupModel<Test, TestModel>(
			'TestWithTypeKeyModel', { name: { $type: String } }, {}, { typeKey: '$type' }
		);
	});

	after(async function() {
		await dropModel('TestWithTypeKeyModel');
	});

	it('create() -> set deleted=false', async function() {
		const puffy = await TestModel.create({ name: 'Puffy1' });
		expect(puffy.deleted).to.equal(false);
	});

	it('delete() -> set deleted=true', async function() {
		const puffy = await TestModel.findOne({ name: 'Puffy1' }).orFail();
		const success = await puffy.delete();
		expect(success.deleted).to.equal(true);
	});

	it('restore() -> set deleted=false', async function() {
		const puffy = await TestModel.findOne({ name: 'Puffy1' }).withDeleted().orFail();
		const success = await puffy.restore();
		expect(success.deleted).to.equal(false);
	});
});
