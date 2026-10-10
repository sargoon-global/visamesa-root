import {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function createMockNavigation<
  ParamList extends Record<string, object | undefined>,
  RouteName extends keyof ParamList,
>(): NativeStackNavigationProp<ParamList, RouteName> {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    getParent: jest.fn(() => ({
      navigate: jest.fn(),
    })),
  } as unknown as NativeStackNavigationProp<ParamList, RouteName>;
}
