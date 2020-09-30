# Authorization in Loopback4

[<img src="https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png" alt="LoopBack" style="zoom: 50%;" />](http://loopback.io/)

The steps which are mentioned below is to add the Authorization part in your project if Authentication is already implemented but If you haven't implement that then you can refer this repo [How to Add Authentication in Loopback4](https://github.com/HrithikMittal/loopback4-auth).

NOTE: The steps and the project setup is taken into the continuation of the Previous project that is Authentication in Loopback4. So can go through the Readme and get to know about it.
[How to Add Authentication in Loopback4](https://github.com/HrithikMittal/loopback4-auth).


## How to Setup in local System

```powershell
git clone https://github.com/HrithikMittal/loopback4-authorization
cd loopback4-authorization
npm install

npm run build
npm run migrate
npm start
```



* ### Step1:

  Add the permission property into the User model 

  ```typescript
  @property.array(String)
  permission:String[];
  ```

  

* ### Step2: 

  Create a Admin controller which will be empty.

  Now create a ``Permission-keys.ts`` where add permission according to your scenario

  ```typescript
  export const enum PermissionKeys {
    // admin
    CreateJob = 'CreateJob',
    UpdateJob = 'UpdateJob',
    DeleteJob = 'DeleteJob',
  
    // normal authenticated user
    AccessAuthFeature = 'AccessAuthFeature'
  }
  ```

  

  Now create a signup route for admin and add the permissions

  ```typescript
  async createAdmin(@requestBody() admin: User) {
  
      validateCredentials(_.pick(admin, ['email', 'password']));
      admin.permissions = [
        PermissionKeys.CreateJob,
        PermissionKeys.UpdateJob,
        PermissionKeys.DeleteJob
      ];
  
  
      admin.password = await this.hasher.hashPassword(admin.password);
  
      const savedAdmin = await this.userRepository.create(admin);
      delete savedAdmin.password;
      return savedAdmin;
    }
  ```

  

* ### Step3:

  Create ``Job`` model, repository and controller(CRUD controller) to apply the role based access controller.

  ```typescript
  @property({
      type: 'number',
      id: true,
      generated: true,
    })
    id?: number;
  
    @property({
      type: 'string',
      required: true,
    })
    title: string;
  ```

  

  Now implement the Global interceptor

   ```typescript
  lb4 interceptor authorize
   ```

  It will run before every controller.

  

  Now add the authorize decorator with needed permission in the controller.

  Go to the ``job Create controller`` 

  ```typescript
   @authenticate('jwt', {required: [PermissionKeys.CreateJob]})
  ```

  

* ### Step4:

  Now create a file ``types.ts``

  ```typescript
  import {PermissionKeys} from './authorization/permission-keys';
  
  export interface RequiredPermissions {
    required: PermissionKeys[]
  }
  ```

  

  Now go to the authenticate interceptor and add the Metadata

  ```typescript
  // first inject it
    constructor(
      @inject(AuthenticationBindings.METADATA)
      public metadata: AuthenticationMetadata
    ) {}
  
  .
  .
  .
  
  console.log('Log from authorize global interceptor')
  console.log(this.metadata);
  
  // if you not provide options in your @authenticate decorator
  if (!this.metadata) return await next();
  const requriedPermissions = this.metadata.options as RequiredPermissions;
  
  console.log(requriedPermissions);
  .
  .
  .
  ```

  (check it in the file)

  

* ### Step 5:

  Now again go to the ``types.ts`` and implement the interface ``MyUserProfile``

  ```typescript
  
  export interface MyUserProfile {
    id: string;
    email?: string;
    name: string;
    permissions: PermissionKeys[];
  }
  ```

  

* ### Step 6: 

  Now to get the User Profile object we add dependency injection in ``authorize interceptor``

  ```typescript
      // dependency inject
      @inject.getter(AuthenticationBindings.CURRENT_USER)
      public getCurrentUser: Getter<MyUserProfile>,
  
  ```

  

* ### Step 7:

  Now what you have done in [[Step7: How to Protect a route]()] go to the ``verifytoken`` method in ``jwt service`` and add the permissions in return object

  ```typescript
  async verifyToken(token: string): Promise<UserProfile> {
  
      if (!token) {
        throw new HttpErrors.Unauthorized(
          `Error verifying token:'token' is null`
        )
      };
  
      let userProfile: UserProfile;
      try {
        const decryptedToken = await verifyAsync(token, this.jwtSecret);
        userProfile = Object.assign(
          {[securityId]: '', id: '', name: '', permissions: []},
          {
            [securityId]: decryptedToken.id,
            id: decryptedToken.id, name: decryptedToken.name,
            permissions: decryptedToken.permissions
          }
        );
      }
      catch (err) {
        throw new HttpErrors.Unauthorized(`Error verifying token:${err.message}`)
      }
      return userProfile;
    }
  ```

  and also return permissions in the return ``convertToUserProfile`` method in ``user service``  [[Step4:]()]

  ```
   return {
        [securityId]: user.id!.toString(),
        name: userName,
        id: user.id,
        email: user.email,
        permissions: user.permissions
      };	
  ```

  

* ### Step 8:

  Now go back again to the ``interceptor`` and add the all the checks here

  ```typescript
  
  console.log('Log from authorize global interceptor')
  console.log(this.metadata);
  
  // if you not provide options in your @authenticate decorator
  if (!this.metadata) return await next();
  
  const requriedPermissions = this.metadata.options as RequiredPermissions;
  
  // console.log(requriedPermissions);
  const user = await this.getCurrentUser();
  
  //console.log('User Permissions:', user.permissions);
  const results = intersection(
  	user.permissions,
  	requriedPermissions.required,
  ).length;
  if (results !== requriedPermissions.required.length) {
  	throw new HttpErrors.Forbidden('INVALID ACCESS');
  }
  
  const result = await next();
  // Add post-invocation logic here
  return result;
  ```

  (you can check the file in the folder)
  
  
  
* ### Step9: Testing

  Now add the decorator to the controller on which you want to add the authorization like this

  ```typescript
  @authenticate('jwt', {required: [PermissionKeys.CreateJob]})
  ```

  


# Finally Done 



