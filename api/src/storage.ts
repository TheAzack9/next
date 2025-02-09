import {
	StorageManager,
	LocalFileSystemStorage,
	StorageManagerConfig,
	Storage,
} from '@slynova/flydrive';
import env from './env';
import { validateEnv } from './utils/validate-env';
import { getConfigFromEnv } from './utils/get-config-from-env';

/** @todo dynamically load these storage adapters */
import { AmazonWebServicesS3Storage } from '@slynova/flydrive-s3';
import { GoogleCloudStorage } from '@slynova/flydrive-gcs';
import { AzureBlobWebServicesStorage } from '@slynova/flydrive-azureBlob';

validateEnv(['STORAGE_LOCATIONS']);

const storage = new StorageManager(getStorageConfig());

registerDrivers(storage);

export default storage;

function getStorageConfig(): StorageManagerConfig {
	const config: StorageManagerConfig = {
		disks: {},
	};

	const locations = env.STORAGE_LOCATIONS.split(',');

	locations.forEach((location: string) => {
		location = location.trim();

		const diskConfig = {
			driver: env[`STORAGE_${location.toUpperCase()}_DRIVER`],
			config: getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`),
		};

		delete diskConfig.config.publicUrl;
		delete diskConfig.config.driver;
		// tslint:disable-next-line:no-console
		console.log('DISKCONFIG', location, diskConfig);
		config.disks![location] = diskConfig;
	});

	return config;
}

function registerDrivers(storage: StorageManager) {
	const usedDrivers: string[] = [];

	for (const [key, value] of Object.entries(env)) {
		if ((key.startsWith('STORAGE') && key.endsWith('DRIVER')) === false) continue;
		if (value && usedDrivers.includes(value) === false) usedDrivers.push(value);
	}

	usedDrivers.forEach((driver) => {
		const storageDriver = getStorageDriver(driver);

		if (storageDriver) {
			storage.registerDriver<Storage>(driver, storageDriver);
		}
	});
}

function getStorageDriver(driver: string) {
	switch (driver) {
		case 'local':
			return LocalFileSystemStorage;
		case 's3':
			return AmazonWebServicesS3Storage;
		case 'gcs':
			return GoogleCloudStorage;
		case 'azureBlob':
			return AzureBlobWebServicesStorage;
	}
}
