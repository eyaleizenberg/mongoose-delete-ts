import * as crypto from 'crypto';
import {
	Deleted,
	DeletedBy,
	DeletedByMethods,
	DeletedByStaticMethods,
	DeletedMethods,
	DeletedQueryHelpers,
	DeletedStaticMethods
} from '../source';
import { Model, Types } from 'mongoose';
import { describe } from 'mocha';
import setupModel from './utils/setupModel';
import dropModel from './utils/dropModel';
import { expect } from 'chai';
import { expectDeletedCount, expectMatchCount, expectOk } from './utils/mongooseExpects';

type TestDeletedBy = { name: string } & Deleted & DeletedBy<Types.ObjectId>;
type TestQueryHelpers = DeletedQueryHelpers<TestDeletedBy>;
type TestDeletedByModel = Model<TestDeletedBy, TestQueryHelpers, DeletedMethods & DeletedByMethods<Types.ObjectId>> &
	DeletedStaticMethods<TestDeletedBy, TestQueryHelpers> &
	DeletedByStaticMethods<TestDeletedBy, Types.ObjectId, TestQueryHelpers>;

describe('deletedBy=true', function() {
	let TestModel: TestDeletedByModel;

	before(async function() {
		TestModel = setupModel<TestDeletedBy, TestDeletedByModel>(
			'TestDeletedBy',
			{ name: String },
			{ deletedBy: true });
	});

	after(async function() {
		await dropModel('TestDeletedBy');
	});

	it('deleteByUser() -> set deletedBy', async function() {
		const puffy = await TestModel.create({ name: 'Puffy1' });

		const userId = new Types.ObjectId();
		const success = await puffy.deleteByUser(userId);

		expect(success.deletedBy).to.deep.equal(userId);
	});

	it('deleteOneByUser() -> set deletedBy', async function() {
		await TestModel.create({ name: 'Puffy2' });

		const userId = new Types.ObjectId();
		const result = await TestModel.deleteOneByUser(userId, { name: 'Puffy2' });

		expectOk(result);
		expectDeletedCount(result, 1);

		const puffy = await TestModel.findOne({ name: 'Puffy2' }).withDeleted().orFail();

		expect(puffy.deletedBy).to.deep.equal(userId);
	});

	it('restore() -> unset deletedBy', async function() {
		const puffy = await TestModel.findOne({ name: 'Puffy1' }).withDeleted().orFail();

		const success = await puffy.restore();

		expect(success.deletedBy).to.not.exist;
	});

	it('restoreOne() -> unset deletedBy', async function() {
		const result = await TestModel.restoreOne({ name: 'Puffy2' });

		expectOk(result);
		expectMatchCount(result, 1);

		const puffy = await TestModel.findOne({ name: 'Puffy2' }).withDeleted().orFail();

		expect(puffy.deletedBy).to.not.exist;
	});
});

describe('deletedBy=deleted_by', function() {
	let TestModel: TestDeletedByModel;

	before(async function() {
		TestModel = setupModel<TestDeletedBy, TestDeletedByModel>(
			'TestDeletedByCustomField',
			{ name: String },
			{ deletedBy: 'deleted_by' });
	});

	after(async function() {
		await dropModel('TestDeletedByCustomField');
	});

	it('deleteByUser() -> set deletedBy', async function() {
		const puffy = await TestModel.create({ name: 'Puffy1' });

		const userId = new Types.ObjectId();
		const success = await puffy.deleteByUser(userId);

		expect(success.deletedBy).to.deep.equal(userId);
		expect(success.get('deleted_by')).to.deep.equal(userId);
	});

	it('restore() -> unset deletedAt', async function() {
		const puffy = await TestModel.findOne({ name: 'Puffy1' }).withDeleted().orFail();

		const success = await puffy.restore();

		expect(success.deletedBy).to.not.exist;
		expect(success.get('deleted_by')).to.not.exist;
	});
});

type User = { id: string }
type TestDeletedByString = { name: string } & Deleted & DeletedBy<User>;
type TestDeletedByStringQueryHelpers = DeletedQueryHelpers<TestDeletedByString>;
type TestDeletedByStringModel = Model<TestDeletedByString, TestDeletedByStringQueryHelpers, DeletedMethods & DeletedByMethods<string>> &
	DeletedStaticMethods<TestDeletedByString, TestDeletedByStringQueryHelpers> &
	DeletedByStaticMethods<TestDeletedByString, string, TestDeletedByStringQueryHelpers>;

describe('deletedBy custom schema', function() {
	let TestModel: TestDeletedByStringModel;

	before(async function() {
		TestModel = setupModel<TestDeletedByString, TestDeletedByStringModel>(
			'TestDeletedByCustomSchema',
			{ name: String },
			{ deletedBy: { name: 'deleted_by', type: String, get: (id: string) => { return id && { id }; } } });
	});

	after(async function() {
		await dropModel('TestDeletedByCustomSchema');
	});

	it('deleteByUser() -> set deletedBy', async function() {
		const puffy = await TestModel.create({ name: 'Puffy1' });

		const userId = new Types.ObjectId().toString();
		const success = await puffy.deleteByUser(userId);

		expect(success.deletedBy).to.deep.equal({ id: userId });
	});

	it('restore() -> unset deletedAt', async function() {
		const puffy = await TestModel.findOne({ name: 'Puffy1' }).withDeleted().orFail();

		const success = await puffy.restore();

		expect(success.deletedBy).to.not.exist;
	});
});

describe('deletedBy object without alias', function() {
	let TestModel: TestDeletedByStringModel;

	before(async function() {
		TestModel = setupModel<TestDeletedByString, TestDeletedByStringModel>(
			'TestDeletedByWithoutAlias',
			{ name: String },
			{ deletedBy: { type: String } });
	});

	after(async function() {
		await dropModel('TestDeletedByWithoutAlias');
	});

	it('deleteByUser() -> set deletedBy', async function() {
		const puffy = await TestModel.create({ name: 'Daffy1' });

		const userId = crypto.randomBytes(10).toString('hex');
		const success = await puffy.deleteByUser(userId);

		expect(success.deletedBy).to.equal(userId);
	});

	it('restore() -> unset deletedAt', async function() {
		const puffy = await TestModel.findOne({ name: 'Daffy1' }).withDeleted().orFail();

		const success = await puffy.restore();

		expect(success.deletedBy).to.not.exist;
	});
});
