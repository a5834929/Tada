package com.tada;

import java.math.BigDecimal;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;

import net.authorize.Environment;
import net.authorize.Merchant;
import net.authorize.TransactionType;
import net.authorize.aim.cardpresent.DeviceType;
import net.authorize.aim.cardpresent.MarketType;
import net.authorize.auth.PasswordAuthentication;
import net.authorize.auth.SessionTokenAuthentication;
import net.authorize.data.creditcard.CreditCard;
import net.authorize.data.Order;
import net.authorize.data.OrderItem;
import net.authorize.data.mobile.MobileDevice;

import android.util.Log;

public class RNAuthNetSDKModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "RNAuthNetSDKModule";
    
    private final ReactApplicationContext reactContext;
    private String deviceID;
    
    private Merchant merchant;

    public RNAuthNetSDKModule(ReactApplicationContext reactContext) {
	super(reactContext);
	this.reactContext = reactContext;
    }

    @Override
    public String getName() {
	return "RNAuthNetSDK";
    }

    private boolean isNotInit() {
	return (this.merchant == null);
    }

    @ReactMethod
    public void initAuthNet(String env, String devID, String user, String pass, Promise promise) {
	if (!this.isNotInit()) {
	    promise.reject("anet_already_init", new Exception("Authorize merchant interface already initialized!"));
	    return;
	}
	if (!(env.equalsIgnoreCase("live") || env.equalsIgnoreCase("test"))) {
	    Log.e(TAG, "Provided envrionment was neither 'test' nor 'live'.");
	    promise.reject("bad_env", new Exception("Provided envrionment was neither 'test' nor 'live'."));
	    return;
	}
	
	this.deviceID = devID;

	Environment environment = env.equalsIgnoreCase("live") ? Environment.PRODUCTION : Environment.SANDBOX;
	Log.d(TAG, "Received environment: " + env);
	PasswordAuthentication passAuth = PasswordAuthentication.createMerchantAuthentication(user, pass, this.deviceID);
	Log.d(TAG, "Creating merchant with password auth");
	this.merchant = Merchant.createMerchant(environment, passAuth);

	Log.d(TAG, "Attempting mobile login");
	net.authorize.mobile.Transaction logTxn = this.merchant.createMobileTransaction(net.authorize.mobile.TransactionType.MOBILE_DEVICE_LOGIN);
	MobileDevice mobileDevice = MobileDevice.createMobileDevice(this.deviceID, "Test EMV Android", "555-555-5555", "Android");
	logTxn.setMobileDevice(mobileDevice);

	net.authorize.mobile.Result logRes = (net.authorize.mobile.Result) this.merchant.postTransaction(logTxn);
	if (logRes.isOk()) {
	    Log.d(TAG, "Login OK");
	    try {
		SessionTokenAuthentication sTok1 = SessionTokenAuthentication.createMerchantAuthentication(this.merchant.getMerchantAuthentication().getName(), logRes.getSessionToken(), this.deviceID);
		if ((logRes.getSessionToken() != null) && (sTok1 != null)) {
		    Log.d(TAG, "Successfully captured session token");
		    this.merchant.setMerchantAuthentication(sTok1);
		    this.merchant.setDeviceType(DeviceType.WIRELESS_POS);
		    this.merchant.setMarketType(MarketType.RETAIL);
		    promise.resolve(true);
		    return;
		}
	    } catch (Exception ex) {
		Log.e(TAG, "Exception trying to capture token! " + ex.getMessage());
		promise.reject("caught_exception", ex);
		return;
	    }
	} else {
	    Log.e(TAG, "Login FAIL: " + logRes.getXmlResponse());
	    promise.reject("result_not_ok", new Exception("Got a log response back that was not OK"));
	    return;
	}
    }    

    @ReactMethod
    public void chargeIt(Promise promise) {
	if (this.isNotInit()) {
	    promise.reject("anet_not_init", new Exception("Not logged in to Authorize merchant interface!"));
	    return;
	}

	Log.d(TAG, "Trying to charge it");
	net.authorize.aim.Transaction txn = net.authorize.aim.Transaction.createTransaction(this.merchant, net.authorize.TransactionType.AUTH_CAPTURE, new BigDecimal(1.0));

	CreditCard creditCard = CreditCard.createCreditCard();
	creditCard.setCreditCardNumber("4111111111111111");
	creditCard.setExpirationMonth("11");
	creditCard.setExpirationYear("2020");
	creditCard.setCardCode("123");
	txn.setCreditCard(creditCard);

	Log.d(TAG, "Submitting auth-capture request");
	net.authorize.aim.Result res = (net.authorize.aim.Result) this.merchant.postTransaction(txn);
	if (res.isOk()) {
	    Log.d(TAG, "Charge OK");
	    try {
		String txnId = res.getTransId();
		Log.d(TAG, "Got transaction ID " + txnId);
		promise.resolve(txnId);
		return;
	    } catch (Exception ex) {
		Log.e(TAG, "Exception trying to parse response! " + ex.getMessage());
		promise.reject("caught_exception", ex);
		return;
	    }
	} else {
	    Log.e(TAG, "Charge FAIL" + res.getXmlResponse());
	    promise.reject("result_not_ok", new Exception("Got a response that was not OK"));
	    return;
	}
    }

}
