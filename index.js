/**
 * remote db service
 */

const request = require('request-promise');

let dbServer = null;
const callApi = async (methodUrl, payload) => {
  try{
    const options = {
      method: 'POST',
      uri: `${dbServer}${methodUrl}`,
      body: payload,
      json: true // Automatically parses the JSON string in the response
    };
    const result = await request(options);
    // console.log(result, 'request');
    return result;
  }catch(err) {
    const {error, status} = err;
    if(error) {
      return error;
    }
    return null;
  }
}

const Redis =  {

  async getAsync (key) {
    const result = await callApi('/api/callRedis', {
      method: 'getAsync',
      key
    })
    return result;
  },

  async setAsync (key, value, expire = null) {
    const result = await callApi('/api/callRedis', {
      method: 'setAsync',
      key,
      value,
      expire
    })
    return result;
  }
}

class Chain {
  constructor(collectionName){//constructor是一个构造方法，用来接收参数
    this.collectionName = collectionName;//this代表的是实例对象
    this.conditions = null;
    this.docId = null;
    this.skipNo = 0;
    this.limitNo = 10;

    return this;
  }

  where (conditions) {
    this.conditions = conditions;
    return this;
  }

  doc (docId) {
    this.docId = docId;
    return this;
  }

  skip (no = 0) {
    this.skipNo = no;
    return this;
  }

  limit (no = 10) {
    this.limitNo = no;
    return this;
  }

  populate (str) {
    this.populateData = str;
    return this;
  }

  async getOne () {
    return this.get(true)
  }

  async count () {
    this.countStatus = true;
    return this.get();
  }

  async get (single = false) {
    if(!this.collectionName) return null;
    const payload = {};
    payload.collection = this.collectionName;
    if(this.conditions) {
      payload.where = this.conditions;
    }
    if(this.docId) {
      payload.docId = this.docId;
    }
    if(single) {
      payload.single = true;
    }

    if(this.skip) {
      payload.skip = this.skipNo;
    }
    if(this.limit) {
      payload.limit = this.limitNo;
    }
    if(this.countStatus) {
      payload.count = this.countStatus;
    }

    if(this.populateData) {
      payload.populate = this.populateData;
    }

    console.log('payload', JSON.stringify(payload))
    const result = await callApi('/api/getCollectionRecords', payload)
    return result;
  }

  async add ({data}) {
    if(!this.collectionName || !data) return null;
    const payload = {};
    payload.collection = this.collectionName;
    payload.data = data;
    const result = await callApi('/api/createCollectionRecords', payload)
    return result;
  }

  async update ({data}) {
    const payload = {};
    payload.collection = this.collectionName;
    payload.data = data;
    if(this.conditions) {
      payload.where = this.conditions;
    }
    if(this.docId) {
      payload.docId = this.docId;
    }

    const result = await callApi('/api/updateCollectionRecords', payload)
    return result;
  }

  async remove () {
    const payload = {};
    payload.collection = this.collectionName;
    if(this.conditions) {
      payload.where = this.conditions;
    }
    if(this.docId) {
      payload.docId = this.docId;
    }

    const result = await callApi('/api/removeCollectionRecords', payload)
    return result;
  }

}


module.exports = function (configServer) {
  dbServer = configServer;
  return {
    redis : Redis,
    collection (collectionName) {
      return new Chain(collectionName);
    }
  }
}
