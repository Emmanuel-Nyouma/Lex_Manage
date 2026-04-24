import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

class Database {
  constructor() {
    this.data = {
      cabinets: [],
      users: [],
      cases: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_PATH)) {
      this.save();
    } else {
      this.load();
    }
  }

  load() {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      console.error('Error loading database:', error);
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Generic CRUD helpers
  find(collection, predicate) {
    return this.data[collection].find(predicate);
  }

  findAll(collection, predicate) {
    if (!predicate) return this.data[collection];
    return this.data[collection].filter(predicate);
  }

  insert(collection, item) {
    this.data[collection].push(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, id) {
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      const removed = this.data[collection].splice(index, 1);
      this.save();
      return removed[0];
    }
    return null;
  }
}

const db = new Database();
export default db;
