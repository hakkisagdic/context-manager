import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VectorStore } from '../lib/rag/VectorStore.js';
import { MockEmbeddingProvider } from '../lib/rag/EmbeddingProvider.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('RAG Engine', () => {
  let tmpDir;
  let vectorStore;
  let embeddingProvider;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rag-test-'));
    embeddingProvider = new MockEmbeddingProvider(10); // Low dimension for speed/testing
    vectorStore = new VectorStore(embeddingProvider, tmpDir);
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  });

  it('should initialize and create table on adding documents', async () => {
    await vectorStore.addDocument('Hello world', { source: 'test' });
    
    // Search
    const results = await vectorStore.search('Hello');
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('Hello world');
    expect(results[0].metadata.source).toBe('test');
  });

  it('should find relevant documents', async () => {
    await vectorStore.addDocuments([
      { text: 'The cat sits on the mat', metadata: { type: 'animal' } },
      { text: 'The dog chases the ball', metadata: { type: 'animal' } },
      { text: 'Javascript is a programming language', metadata: { type: 'code' } }
    ]);

    const results = await vectorStore.search('The cat', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('score');
    expect(results[0]).toHaveProperty('text');
  });
  
  it('should handle persistence', async () => {
    await vectorStore.addDocument('Persistent data');
    
    // Create new instance pointing to same dir
    const newStore = new VectorStore(embeddingProvider, tmpDir);
    // Init is called implicitly on search
    const results = await newStore.search('Persistent');
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('Persistent data');
  });
});
