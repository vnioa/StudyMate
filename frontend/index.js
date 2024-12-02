import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native-web'; // 이 부분이 필요합니다.
import App from './App';

// 웹 환경에서 앱을 실행하기 위한 설정
AppRegistry.registerComponent('main', () => App);

// Expo용 기본 설정
registerRootComponent(App);
