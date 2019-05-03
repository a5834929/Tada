package com.tada;

import java.math.BigDecimal;
import java.util.Hashtable;
import java.util.List;

import com.bbpos.bbdevice.BBDeviceController;
import com.bbpos.bbdevice.ota.BBDeviceOTAController;
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
import net.authorize.aim.emv.EMVDeviceConnectionType;
import net.authorize.aim.emv.EMVErrorCode;
import net.authorize.aim.emv.EMVTransaction;
import net.authorize.aim.emv.EMVTransactionManager;
import net.authorize.aim.emv.EMVTransactionType;
import net.authorize.aim.emv.OTAUpdateActivity;
import net.authorize.aim.emv.OTAUpdateHeadless;
import net.authorize.aim.emv.OTAUpdateManager;
import net.authorize.aim.emv.Result;
import net.authorize.auth.PasswordAuthentication;
import net.authorize.auth.SessionTokenAuthentication;
import net.authorize.data.creditcard.CreditCard;
import net.authorize.data.Order;
import net.authorize.data.OrderItem;
import net.authorize.data.mobile.MobileDevice;

import android.bluetooth.BluetoothDevice;
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

    private boolean isInit() {
        return (this.merchant != null);
    }

    @ReactMethod
    public void initAuthNet(String env, String devID, String user, String pass, Promise promise) {
        if (this.isInit()) {
            promise.reject("anet_already_init", "Authorize merchant interface already initialized!");
            return;
        }
        if (!(env.equalsIgnoreCase("live") || env.equalsIgnoreCase("test"))) {
            Log.e(TAG, "Provided envrionment was neither 'test' nor 'live'.");
            promise.reject("bad_env", "Provided envrionment was neither 'test' nor 'live'.");
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
            promise.reject("result_not_ok", "Got a log response back that was not OK");
            return;
        }
    }

    @ReactMethod
    public void chargeIt(Promise promise) {
        if (!this.isInit()) {
            promise.reject("anet_not_init", "Not logged in to Authorize merchant interface!");
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
            promise.reject("result_not_ok", "Got a response that was not OK");
            return;
        }
    }

    @ReactMethod
    public void quickChip(Promise promise) {
        if (!this.isInit()) {
            promise.reject("anet_not_init", "Not logged in to Authorize merchant interface!");
            return;
        }

        Log.d(TAG, "Trying to take a chip off the old block");
        EMVTransaction emvTransaction = EMVTransactionManager.createEMVTransaction(merchant, new BigDecimal(1.42));
        emvTransaction.setEmvTransactionType(EMVTransactionType.PAYMENT);

        EMVTransactionManager.QuickChipTransactionSessionListener emvSessionListener = new EMVTransactionManager.QuickChipTransactionSessionListener() {
            @Override
            public void onTransactionStatusUpdate(String s) {
                Log.d(TAG, "Quick Chip status update: " + s);
            }

            @Override
            public void onPrepareQuickChipDataSuccessful() {
                Log.i(TAG, "Quick chip data success! Starting transaction...");
                EMVTransactionManager.startQuickChipTransaction(emvTransaction, this, reactContext);
            }

            @Override
            public void onPrepareQuickChipDataError(EMVErrorCode emvErrorCode, String s) {
                String msg = "QuickChipDataError: " + s;
                Log.e(TAG, msg);

                // Clear quick chip data from storage in the event of an error.
                EMVTransactionManager.clearStoredQuickChipData(this);
                promise.reject("chip_data_error", msg);
            }

            @Override
            public void onReturnBluetoothDevices(List<BluetoothDevice> list) {
                Log.d(TAG, "Got bluetooth device list: " + list);
                if (list.size() > 0) {
                    BluetoothDevice dev = list.get(0);
                    Log.d(TAG, "Connecting to device address: " + dev.getAddress() + ", name: " + dev.getName());
                    EMVTransactionManager.connectBTDevice(reactContext, dev, this);
                } else {
                    String msg = "No valid bluetooth devices found in scan.";
                    Log.e(TAG, msg);
                    promise.reject("bt_not_found", msg);
                }
            }

            @Override
            public void onBluetoothDeviceConnected(BluetoothDevice bluetoothDevice) {
                Log.i(TAG, "Bluetooth device connected.");
                EMVTransactionManager.prepareDataForQuickChipTransaction(reactContext, this);
            }

            @Override
            public void onBluetoothDeviceDisConnected() {
                Log.e(TAG, "Bluetooth device dis connected.");
            }

            @Override
            public void onEMVTransactionSuccessful(Result result) {
                Log.i(TAG, "EMV transaction success!");
                Log.d(TAG, "EMV transaction response: " + result.getXmlResponse());
                promise.resolve(result.getTransId());
            }

            @Override
            public void onEMVReadError(EMVErrorCode emvErrorCode) {
                String msg = "EMV read error: " + emvErrorCode.getErrorString();
                Log.e(TAG, msg);
                promise.reject("emv_read_error", msg);
            }

            @Override
            public void onEMVTransactionError(Result result, EMVErrorCode emvErrorCode) {
                Log.e(TAG, "EMV transaction error: " + emvErrorCode.getErrorString());
                Log.d(TAG, "EMV transaction error response: " + result.getXmlResponse());
                promise.reject("emv_transaction_error", emvErrorCode.getErrorString());
            }
        };

        EMVTransactionManager.setDeviceConnectionType(EMVDeviceConnectionType.BLUETOOTH);
        EMVTransactionManager.startBTScan(reactContext, emvSessionListener);
    }

    @ReactMethod
    public void doOTAUpdate() {
        Log.i(TAG, "Attempting to do an OTA update on the chip reader over Bluetooth...");

        OTAUpdateManager.HeadlessOTAUpdateListener otaUpdateListener = new OTAUpdateManager.HeadlessOTAUpdateListener() {
            @Override
            public void onReturnOTAUpdateHeadlessProgress(OTAUpdateManager.HeadlessOTAUpdateStatus headlessOTAUpdateStatus, double v) {
                Log.d(TAG, "progress: " + headlessOTAUpdateStatus.name() + " " + v);
            }

            @Override
            public void onReturnCheckForUpdateResult(OTAUpdateManager.HeadlessOTACheckResult headlessOTACheckResult) {
                Log.i(TAG, "check result: " + headlessOTACheckResult.needUpdate() + " " + headlessOTACheckResult.toString());
            }

            @Override
            public void onReturnOTAUpdateHeadlessResult(OTAUpdateManager.HeadlessOTAUpdateType headlessOTAUpdateType, OTAUpdateManager.HeadlessOTAUpdateResult headlessOTAUpdateResult, String s) {
                Log.i(TAG, "update result: " + headlessOTAUpdateType.name() + " " + headlessOTAUpdateResult.name() + " " + s);
                if (headlessOTAUpdateType == OTAUpdateManager.HeadlessOTAUpdateType.ALL && headlessOTAUpdateResult == OTAUpdateManager.HeadlessOTAUpdateResult.SUCCESS) {
                    OTAUpdateManager.finishOTAUpdateHeadless();
                }
            }

            @Override
            public void onReturnDeviceInfo(Hashtable<String, String> hashtable) {
                Log.d(TAG, "Device info: " + hashtable.toString());
            }

            @Override
            public void onReturnOTAUpdateError(OTAUpdateManager.HeadlessOTAUpdateError headlessOTAUpdateError, String s) {
                Log.e(TAG, "update error: " + headlessOTAUpdateError.name() + " " + s);
            }

            @Override
            public void onBluetoothScanTimeout() {
                Log.e(TAG, "Scan timeout");
            }

            @Override
            public void onReturnBluetoothDevices(List<BluetoothDevice> list) {
                Log.d(TAG, "Got bluetooth device list: " list);
                OTAUpdateManager.connectBluetoothDevice(list.get(0));
            }

            @Override
            public void onBluetoothDeviceConnected(BluetoothDevice bluetoothDevice) {
                Log.i(TAG, "Connected");
                //OTAUpdateManager.getDeviceInfo(reactContext, true, this);
                OTAUpdateManager.checkForOTAUpdates(reactContext, true, this);
                //OTAUpdateManager.startOTAUpdateHeadless(reactContext, OTAUpdateManager.HeadlessOTAUpdateType.ALL, true, this);
            }

            @Override
            public void onBluetoothDeviceDisConnected() {
                Log.e(TAG, "BT disconnect");
            }

            @Override
            public void onAudioAutoConfigProgressUpdate(double v) {

            }

            @Override
            public void onAudioAutoConfigCompleted(boolean b, String s) {

            }

            @Override
            public void onAudioAutoConfigError(BBDeviceController.AudioAutoConfigError audioAutoConfigError) {

            }
        };
        OTAUpdateManager.initBluetoothConnection(reactContext, true, otaUpdateListener);
    }
}
