import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Interface for MongoDB connection errors
interface MongoError extends Error {
  code?: string | number;
  reason?: unknown;
}

export async function GET() {
  console.log('🔍 Testing MongoDB connection...');
  
  // Check if MONGODB_URI exists
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({
      success: false,
      error: 'MONGODB_URI not found in environment variables'
    }, { status: 500 });
  }
  
  // Mask the URI for security (show only the structure)
  const maskedUri = process.env.MONGODB_URI.replace(
    /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
    'mongodb+srv://***:***@'
  );
  console.log('📝 MongoDB URI structure:', maskedUri);
  
  try {
    console.log('🔌 Attempting to connect...');
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    const connectionInfo = {
      database: connection.connection.db?.databaseName,
      host: connection.connection.host,
      port: connection.connection.port,
      readyState: connection.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.connection.readyState]
    };
    
    console.log('📊 Connection details:', connectionInfo);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to MongoDB!',
      connectionInfo,
      maskedUri
    });
    
  } catch (error: unknown) {
    console.error('❌ Connection failed:');
    
    // Type guard functions
    const isError = (err: unknown): err is Error => err instanceof Error;
    const isMongoError = (err: unknown): err is MongoError => 
      err instanceof Error && ('code' in err || 'reason' in err);
    
    const errorMessage = isError(error) ? error.message : String(error);
    const errorName = isError(error) ? error.constructor.name : 'Unknown';
    
    console.error('  - Error type:', errorName);
    console.error('  - Error message:', errorMessage);
    
    // Safely extract MongoDB-specific properties
    const mongoError = isMongoError(error) ? error : null;
    const errorCode = mongoError?.code;
    const errorReason = mongoError?.reason;
    
    const errorInfo = {
      type: errorName,
      message: errorMessage,
      code: errorCode,
      reason: errorReason ? String(errorReason) : undefined,
    };
    
    if (errorReason) {
      console.error('  - Reason:', errorReason);
    }
    
    if (errorCode) {
      console.error('  - Error code:', errorCode);
    }
    
    // Additional debugging info
    let debugHint = '';
    if (errorMessage.includes('ENOTFOUND')) {
      debugHint = 'DNS resolution failed - check your cluster URL';
      console.error('🔍', debugHint);
    } else if (errorMessage.includes('authentication failed')) {
      debugHint = 'Authentication failed - check username/password';
      console.error('🔍', debugHint);
    } else if (errorMessage.includes('IP')) {
      debugHint = 'IP whitelist issue - verify your IP is whitelisted';
      console.error('🔍', debugHint);
    }
    
    return NextResponse.json({
      success: false,
      error: errorInfo,
      debugHint,
      maskedUri
    }, { status: 500 });
  }
}
