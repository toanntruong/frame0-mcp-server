#!/usr/bin/env node

// Simple test to verify HTTP endpoints work
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('Testing Frame0 MCP HTTP Server endpoints...\n');
  
  // Test health endpoint
  try {
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }
  
  // Test info endpoint
  try {
    console.log('\n🔍 Testing info endpoint...');
    const infoResponse = await fetch(`${SERVER_URL}/info`);
    const infoData = await infoResponse.json();
    console.log('✅ Info endpoint:', infoData);
  } catch (error) {
    console.log('❌ Info endpoint failed:', error.message);
  }
  
  // Test MCP initialize request
  try {
    console.log('\n🔍 Testing MCP initialize...');
    const mcpResponse = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      })
    });
    
    const mcpData = await mcpResponse.json();
    console.log('✅ MCP initialize response:', mcpData);
    
    // Extract session ID for further requests
    const sessionId = mcpResponse.headers.get('mcp-session-id');
    if (sessionId) {
      console.log('📋 Session ID:', sessionId);
      
      // Test list tools with session
      try {
        console.log('\n🔍 Testing list tools...');
        const toolsResponse = await fetch(`${SERVER_URL}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'mcp-session-id': sessionId
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          })
        });
        
        const toolsData = await toolsResponse.json();
        console.log('✅ Tools list response:', {
          toolCount: toolsData.result?.tools?.length || 0,
          firstTool: toolsData.result?.tools?.[0]?.name || 'none'
        });
      } catch (error) {
        console.log('❌ List tools failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ MCP endpoint failed:', error.message);
  }
  
  console.log('\n✅ HTTP endpoint testing completed!');
}

testEndpoints().catch(console.error);