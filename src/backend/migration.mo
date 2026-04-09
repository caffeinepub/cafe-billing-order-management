import List "mo:core/List";

module {

  // Old types mirrored from .old/src/backend/main.mo
  type OldOrderItem = {
    menuItemId : Text;
    name       : Text;
    price      : Nat;
    quantity   : Nat;
  };

  type OldOrder = {
    id          : Text;
    orderNumber : Text;
    dateTime    : Text;
    items       : [OldOrderItem];
    total       : Nat;
    paymentType : Text;
  };

  type OldMenuItem = {
    id    : Text;
    name  : Text;
    price : Nat;
  };

  type OldCategory = {
    id    : Text;
    name  : Text;
    items : [OldMenuItem];
  };

  type OldActor = {
    var orders  : [OldOrder];
    var menu    : [OldCategory];
    var counter : Nat;
  };

  // New types match current main.mo
  type OrderItem = {
    menuItemId : Text;
    name       : Text;
    price      : Nat;
    quantity   : Nat;
  };

  type Order = {
    id          : Text;
    orderNumber : Text;
    dateTime    : Text;
    items       : [OrderItem];
    total       : Nat;
    paymentType : Text;
  };

  type MenuItem = {
    id    : Text;
    name  : Text;
    price : Nat;
  };

  type Category = {
    id    : Text;
    name  : Text;
    items : [MenuItem];
  };

  type NewActor = {
    orders  : List.List<Order>;
    menu    : List.List<Category>;
    var counter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      orders  = List.fromArray<Order>(old.orders);
      menu    = List.fromArray<Category>(old.menu);
      var counter = old.counter;
    }
  };
};
