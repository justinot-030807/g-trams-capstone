const { randomUUID } = require('node:crypto');

const capabilities = new WeakMap();

async function supportsTransactions(connection) {
    const client = connection.getClient();
    if (!capabilities.has(client)) {
        const check = connection.db.admin().command({ hello: 1 })
            .then(hello => Boolean(hello.setName || hello.msg === 'isdbgrid'))
            .catch(error => {
                capabilities.delete(client);
                throw error;
            });
        capabilities.set(client, check);
    }
    return capabilities.get(client);
}

function rosterWrites(session, undo) {
    async function update(Model, filter, changes) {
        if (!undo) return Model.findOneAndUpdate(filter, changes, { session, returnDocument: 'after' });

        const datedChanges = Model.schema.path('updatedAt')
            ? { ...changes, $set: { ...changes.$set, updatedAt: new Date() } }
            : changes;
        const previous = await Model.findOneAndUpdate(filter, datedChanges, { returnDocument: 'before', timestamps: false }).lean();
        if (!previous) return null;

        const applied = { ...datedChanges.$set };
        for (const field of Object.keys(changes.$unset || {})) applied[field] = undefined;
        for (const [field, increment] of Object.entries(changes.$inc || {})) {
            applied[field] = (previous[field] || 0) + increment;
        }
        undo.push(async () => {
            const guard = { _id: previous._id };
            const restore = { $set: {}, $unset: {} };
            for (const [field, value] of Object.entries(applied)) {
                const path = Model.schema.path(field);
                const storedValue = path && value != null ? path.applySetters(value) : value;
                guard[field] = storedValue === undefined ? { $exists: false } : { $eq: storedValue };
                if (previous[field] === undefined) restore.$unset[field] = 1;
                else restore.$set[field] = previous[field];
            }
            const result = await Model.collection.updateOne(guard, restore);
            if (!result.matchedCount) throw new Error('Roster compensation could not safely restore a changed record.');
        });
        return Model.findById(previous._id);
    }

    return {
        session,
        update,
        async updateMany(Model, filter, changes) {
            if (!undo) return Model.updateMany(filter, changes, { session });
            const records = await Model.find(filter).select('_id').lean();
            for (const { _id } of records) await update(Model, { ...filter, _id }, changes);
        },
        async create(Model, fields) {
            const [created] = await Model.create([fields], { session });
            if (undo) undo.push(async () => {
                const result = await Model.deleteOne({ _id: created._id, updatedAt: created.updatedAt });
                if (!result.deletedCount) throw new Error('Roster compensation could not safely remove a changed record.');
            });
            return created;
        },
        async remove(Model, filter) {
            const previous = await Model.findOneAndDelete(filter, { session }).lean();
            if (previous && undo) undo.push(() => Model.collection.insertOne(previous));
            return previous;
        }
    };
}

async function withRosterMutation(connection, mutate) {
    if (await supportsTransactions(connection)) {
        return connection.transaction(session => mutate(rosterWrites(session)));
    }

    // A fixed, uniquely indexed MongoDB record serializes compensated mutations across app processes.
    const locks = connection.db.collection('toda_mutation_locks');
    const lock = { _id: 'roster', owner: randomUUID() };
    try {
        await locks.insertOne(lock);
    } catch (error) {
        if (error.code !== 11000) throw error;
        throw Object.assign(new Error('Another TODA update is in progress. Please retry.'), { statusCode: 409 });
    }

    const undo = [];
    try {
        return await mutate(rosterWrites(undefined, undo));
    } catch (error) {
        const rollbackErrors = [];
        for (const rollback of undo.reverse()) {
            try {
                await rollback();
            } catch (rollbackError) {
                rollbackErrors.push(rollbackError);
            }
        }
        if (rollbackErrors.length) {
            throw new AggregateError([error, ...rollbackErrors], 'TODA mutation compensation failed.');
        }
        throw error;
    } finally {
        await locks.deleteOne(lock).catch(error => console.error('Error releasing TODA mutation lock:', error.message));
    }
}

module.exports = { withRosterMutation };
